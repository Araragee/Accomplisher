import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../ui';

const MOCK_TASKS = [
  { id: '1', title: 'Design the new onboarding flow', status: 'In Progress', assignee: 'Dex' },
  { id: '2', title: 'Fix the login hydration bug', status: 'To Do', assignee: 'Sarah' },
];

export function GroupTasksView(): React.JSX.Element {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ink">Group Tasks</h2>
        <button type="button" className="flex items-center gap-2 px-3 py-1.5 bg-accent text-on-accent rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors focus-ring cursor-pointer">
          <Plus className="size-4" strokeWidth={2.5} />
          New Task
        </button>
      </div>

      <div className="grid gap-3">
        {MOCK_TASKS.map(t => (
          <Card key={t.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              <p className="text-xs text-subtle mt-1">Status: {t.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Assigned to: {t.assignee}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
