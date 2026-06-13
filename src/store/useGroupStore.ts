import { useSyncExternalStore } from 'react';
import { api } from '../lib/api';

// Simple store for active group state
let activeGroupId: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return activeGroupId;
}

export function useActiveGroup() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setActiveGroup(id: string | null, userId?: string, userName?: string) {
  if (activeGroupId !== id) {
    if (activeGroupId) {
      api.leaveGroup(activeGroupId);
    }
    
    activeGroupId = id;
    
    if (id) {
      // If we're not connected, connect using the current active member
      // This usually should be done once at app startup, but we do it here for simplicity
      if (userId && userName) {
        api.connect(userId, userName);
      }
      api.joinGroup(id);
    }
    
    listeners.forEach((l) => l());
  }
}
