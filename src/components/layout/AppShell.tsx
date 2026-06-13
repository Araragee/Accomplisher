import React from 'react';
import { Sidebar } from './Sidebar';
import { GroupSidebar } from './GroupSidebar';
import { ServerBar } from './ServerBar';
import { Topbar } from './Topbar';
import { useActiveGroup } from '../../store/useGroupStore';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const activeGroupId = useActiveGroup();

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      <ServerBar />
      {activeGroupId ? <GroupSidebar /> : <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden sm:my-4 sm:mr-4 sm:ml-2 sm:rounded-3xl sm:border sm:border-line sm:shadow-soft bg-surface">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
