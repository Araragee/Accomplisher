import { io, Socket } from 'socket.io-client';

// In a real app, this would be loaded from settings or an env variable.
// For now, we assume the NAS backend runs on a known IP/port or from Vite env.
const NAS_URL = localStorage.getItem('nas_backend_url') || import.meta.env.VITE_NAS_BACKEND_URL || 'http://localhost:3001';

class APIClient {
  private socket: Socket | null = null;
  private messageListeners = new Set<(msg: any) => void>();
  private taskListeners = new Set<(task: any) => void>();
  private fileListeners = new Set<(file: any) => void>();

  connect(userId: string, userName: string) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(NAS_URL, {
      query: { userId, userName }
    });

    this.socket.on('connect', () => {
      console.log('Connected to NAS backend');
    });

    this.socket.on('message', (msg) => {
      this.messageListeners.forEach(l => l(msg));
    });

    this.socket.on('task', (task) => {
      this.taskListeners.forEach(l => l(task));
    });

    this.socket.on('file', (file) => {
      this.fileListeners.forEach(l => l(file));
    });
  }

  joinGroup(groupId: string) {
    this.socket?.emit('join_group', groupId);
  }

  leaveGroup(groupId: string) {
    this.socket?.emit('leave_group', groupId);
  }

  sendMessage(groupId: string, content: string) {
    this.socket?.emit('send_message', { groupId, content });
  }

  // Subscriptions
  onMessage(listener: (msg: any) => void) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  // API calls (could also be standard fetch requests if preferred)
  async fetchMessages(groupId: string) {
    const res = await fetch(`${NAS_URL}/api/groups/${groupId}/messages`);
    return res.json();
  }

  async fetchTasks(groupId: string) {
    const res = await fetch(`${NAS_URL}/api/groups/${groupId}/tasks`);
    return res.json();
  }

  async fetchFiles(groupId: string) {
    const res = await fetch(`${NAS_URL}/api/groups/${groupId}/files`);
    return res.json();
  }
}

export const api = new APIClient();
