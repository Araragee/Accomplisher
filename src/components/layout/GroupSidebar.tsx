import React from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Hash, Settings, ListTodo, FileText, ChevronUp, Check, Users } from 'lucide-react';
import { Link, useRoute, navigate } from '../../router';
import { cn } from '../../lib/cn';
import { useActiveGroup, setActiveGroup } from '../../store/useGroupStore';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}

function NavItem({ to, label, icon: Icon, active }: NavItemProps): React.JSX.Element {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
        active ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-surface hover:text-ink'
      )}
    >
      <Icon className="size-[1.125rem]" strokeWidth={active ? 2 : 1.75} />
      {label}
    </Link>
  );
}

export function GroupSidebar(): React.JSX.Element {
  const route = useRoute();
  const isActive = (to: string) => route === to || route.startsWith(`${to}/`);
  const activeGroupId = useActiveGroup();

  // Mock group data for now
  const groupName = activeGroupId === 'g1' ? 'Design Team' : 'Frontend Devs';

  const NAV = [
    { to: `/group/${activeGroupId}/chat`, label: 'chat', icon: Hash },
    { to: `/group/${activeGroupId}/tasks`, label: 'tasks', icon: ListTodo },
    { to: `/group/${activeGroupId}/files`, label: 'files', icon: FileText },
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-panel sm:flex sm:my-4 sm:ml-2 sm:mr-2 sm:rounded-3xl sm:border sm:border-line sm:shadow-soft overflow-hidden">
      {/* Group Header */}
      <div className="flex h-14 items-center px-5 shrink-0 border-b border-line/40">
        <span className="text-[0.9375rem] font-semibold tracking-tight text-ink truncate">{groupName}</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </nav>
      </div>

      {/* Group Settings / Leave Menu */}
      <div className="border-t border-line px-3 py-3 shrink-0 bg-panel">
        <Menu as="div" className="relative">
          <MenuButton className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface p-2 text-sm transition-colors hover:border-line-strong focus-ring cursor-pointer">
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold text-ink truncate">{groupName}</div>
              <div className="text-[10px] text-muted truncate">Group Actions</div>
            </div>
            <ChevronUp className="size-4 text-subtle" />
          </MenuButton>

          <MenuItems
            anchor="top start"
            transition
            className="z-50 w-58 origin-bottom-left rounded-2xl border border-line bg-raised p-1.5 shadow-soft transition duration-150 ease-out [--anchor-gap:0.5rem] data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink transition-colors data-[focus]:bg-panel cursor-pointer"
              >
                <Users className="size-3.5 text-muted" />
                <span>Members</span>
              </button>
            </MenuItem>
            <MenuItem>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink transition-colors data-[focus]:bg-panel cursor-pointer"
              >
                <Settings className="size-3.5 text-muted" />
                <span>Group Settings</span>
              </button>
            </MenuItem>
            
            <div className="border-t border-line my-1.5" />
            
            <MenuItem>
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-danger transition-colors data-[focus]:bg-danger-soft cursor-pointer"
              >
                <span>Leave Group</span>
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </aside>
  );
}
