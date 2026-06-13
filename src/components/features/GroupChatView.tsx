import React, { useState, useEffect } from 'react';
import { Send, Image as ImageIcon } from 'lucide-react';
import { Avatar } from '../ui';
import { api } from '../../lib/api';
import { useActiveGroup } from '../../store/useGroupStore';
import { useApp } from '../../store/AppContext';

// Mock messages
const MOCK_MESSAGES = [
  { id: '1', author: 'Dex', content: 'Hey team, how are we doing on the new API?', time: '10:00 AM' },
  { id: '2', author: 'Sarah', content: 'Almost done. Just writing the tests now.', time: '10:05 AM' },
];

export function GroupChatView(): React.JSX.Element {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<any[]>(MOCK_MESSAGES);
  const activeGroupId = useActiveGroup();
  const { activeMember } = useApp();

  useEffect(() => {
    if (!activeGroupId) return;

    // Load initial messages
    api.fetchMessages(activeGroupId)
      .then(data => setMessages(data))
      .catch(e => console.warn('NAS backend not reachable, using mock messages', e));

    const unsubscribe = api.onMessage((newMsg: any) => {
      setMessages(prev => [...prev, newMsg]);
    });

    return unsubscribe;
  }, [activeGroupId]);

  const handleSend = () => {
    if (!msg.trim() || !activeGroupId) return;
    
    // Optimistic UI update
    const tempMsg = {
      id: crypto.randomUUID(),
      author: activeMember.name,
      content: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, tempMsg]);
    api.sendMessage(activeGroupId, msg);
    setMsg('');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3">
            <Avatar name={m.author} id={m.author} size="sm" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-ink">{m.author}</span>
                <span className="text-xs text-faint">{m.time}</span>
              </div>
              <p className="text-[0.9375rem] text-ink mt-0.5">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 shrink-0 border-t border-line">
        <div className="flex items-end gap-2 bg-panel p-1.5 rounded-xl border border-line focus-within:border-line-strong transition-colors">
          <button type="button" className="p-2 text-muted hover:text-ink transition-colors cursor-pointer rounded-lg hover:bg-surface">
            <ImageIcon className="size-5" />
          </button>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message #chat"
            className="flex-1 bg-transparent text-[0.9375rem] text-ink placeholder:text-faint resize-none focus:outline-none py-2 px-1 max-h-32"
            rows={1}
          />
          <button type="button" onClick={handleSend} className="p-2 text-accent hover:bg-accent-soft transition-colors cursor-pointer rounded-lg">
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
