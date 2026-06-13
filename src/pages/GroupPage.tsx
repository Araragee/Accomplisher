import React from 'react';
import { useRoute } from '../router';
import { GroupChatView, GroupTasksView, GroupFilesView } from '../components/features';

export function GroupPage(): React.JSX.Element {
  const route = useRoute(); // e.g., /group/g1/chat
  
  // Extract the view from the route (chat, tasks, files)
  const segments = route.split('/');
  const view = segments[3] || 'chat'; // default to chat

  return (
    <div className="h-full">
      {view === 'chat' && <GroupChatView />}
      {view === 'tasks' && <GroupTasksView />}
      {view === 'files' && <GroupFilesView />}
    </div>
  );
}
