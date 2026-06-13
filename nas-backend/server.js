const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const db = new sqlite3.Database('./groups.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    group_id TEXT,
    author TEXT,
    content TEXT,
    time TEXT
  )`);
});

app.get('/api/groups/:id/messages', (req, res) => {
  db.all('SELECT * FROM messages WHERE group_id = ? ORDER BY rowid ASC', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
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
    
    db.run('INSERT INTO messages (id, group_id, author, content, time) VALUES (?, ?, ?, ?, ?)', 
      [msg.id, data.groupId, msg.author, msg.content, msg.time]);

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
