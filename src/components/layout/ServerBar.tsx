import React from 'react';
import { Home, Plus } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useActiveGroup, setActiveGroup } from '../../store/useGroupStore';
import { useApp } from '../../store/AppContext';

// Mock list of groups for now
const MOCK_GROUPS = [
  { id: 'g1', name: 'Design Team' },
  { id: 'g2', name: 'Frontend Devs' },
];

export function ServerBar(): React.JSX.Element {
  const activeGroupId = useActiveGroup();
  const { activeMember } = useApp();

  return (
    <div className="w-[4.5rem] shrink-0 flex flex-col items-center py-4 bg-canvas sm:my-4 sm:ml-4 sm:rounded-3xl space-y-3">
      {/* Personal / Home Button */}
      <div className="relative group flex justify-center w-full">
        <button
          type="button"
          onClick={() => setActiveGroup(null)}
          className={cn(
            'grid size-12 place-items-center rounded-2xl transition-all duration-200 cursor-pointer focus-ring',
            activeGroupId === null
              ? 'bg-accent text-on-accent rounded-[1rem]'
              : 'bg-surface text-ink hover:bg-accent hover:text-on-accent hover:rounded-[1rem]'
          )}
          title="Personal Space"
        >
          <Home className="size-5.5" />
        </button>
        {activeGroupId === null && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
        )}
      </div>

      <div className="w-8 h-[1px] bg-line rounded-full" />

      {/* Group List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto hide-scrollbar">
        {MOCK_GROUPS.map((g) => {
          const isActive = activeGroupId === g.id;
          return (
            <div key={g.id} className="relative group flex justify-center w-full">
              <button
                type="button"
                onClick={() => setActiveGroup(g.id, activeMember.id, activeMember.name)}
                className={cn(
                  'grid size-12 place-items-center rounded-[1.5rem] bg-surface text-ink font-semibold text-sm transition-all duration-200 cursor-pointer focus-ring',
                  isActive
                    ? 'bg-accent text-on-accent rounded-[1rem]'
                    : 'hover:bg-accent hover:text-on-accent hover:rounded-[1rem]'
                )}
                title={g.name}
              >
                {g.name.substring(0, 2).toUpperCase()}
              </button>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
              )}
            </div>
          );
        })}

        {/* Add Group Button */}
        <div className="relative group flex justify-center w-full mt-2">
          <button
            type="button"
            className="grid size-12 place-items-center rounded-[1.5rem] bg-surface text-sage transition-all duration-200 cursor-pointer focus-ring hover:bg-sage hover:text-white hover:rounded-[1rem]"
            title="Add a Group"
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
