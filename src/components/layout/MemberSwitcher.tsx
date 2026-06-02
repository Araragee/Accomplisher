import React from 'react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { Check, ChevronDown, Users } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { navigate } from '../../router';
import { Avatar } from '../ui';
import { cn } from '../../lib/cn';

export function MemberSwitcher(): React.JSX.Element {
  const { members, activeMember, activeMemberId, setActiveMemberId } = useApp();

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center gap-2 rounded-lg border border-line bg-surface py-1 pl-1 pr-2 text-sm transition-colors hover:border-line-strong focus-ring">
        <Avatar name={activeMember.name} id={activeMember.id} size="sm" />
        <span className="max-w-32 truncate font-medium text-ink">{activeMember.name}</span>
        <ChevronDown className="size-4 text-subtle" />
      </MenuButton>

      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 w-64 origin-top-right rounded-xl border border-line bg-raised p-1.5 shadow-soft transition duration-150 ease-out [--anchor-gap:0.5rem] data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        <p className="px-2.5 py-1.5 text-xs font-medium text-subtle">Logging as</p>
        {members.map((m) => (
          <MenuItem key={m.id}>
            <button
              type="button"
              onClick={() => setActiveMemberId(m.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors data-[focus]:bg-panel"
            >
              <Avatar name={m.name} id={m.id} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{m.name}</span>
                {m.role && <span className="block truncate text-xs text-subtle">{m.role}</span>}
              </span>
              {m.id === activeMemberId && <Check className="size-4 text-accent" />}
            </button>
          </MenuItem>
        ))}
        <div className="my-1.5 border-t border-line" />
        <MenuItem>
          <button
            type="button"
            onClick={() => navigate('/team')}
            className={cn('flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-muted transition-colors data-[focus]:bg-panel data-[focus]:text-ink')}
          >
            <span className="grid size-7 place-items-center rounded-full bg-panel text-subtle">
              <Users className="size-3.5" />
            </span>
            Manage team
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
