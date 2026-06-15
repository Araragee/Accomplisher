const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Supabase handles database schema and migrations

app.get('/api/groups/:id/messages', async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('group_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

io.on('connection', (socket) => {
  const { userName } = socket.handshake.query;
  console.log(`${userName} connected`);

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`${userName} joined group ${groupId}`);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
  });

  socket.on('send_message', (data) => {
    const msg = {
      id: Math.random().toString(36).substr(2, 9),
      author: userName,
      content: data.content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const { error } = await supabase.from('messages').insert([{
      id: msg.id,
      group_id: data.groupId,
      author: msg.author,
      content: msg.content,
      time: msg.time
    }]);

    if (error) console.error('Error inserting message:', error.message);

    // Broadcast to everyone else in the group
    socket.to(data.groupId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`${userName} disconnected`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`NAS Backend running on port ${PORT}`);
});
