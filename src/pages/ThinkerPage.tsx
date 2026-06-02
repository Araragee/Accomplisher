import React from 'react';
import { Compass, Plus, RefreshCw, Target, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Badge, Button, Card, CardHeader, CodeTag, EmptyState, Input, Progress, Select, SegmentedControl } from '../components/ui';
import { useThinker } from '../composables/useThinker';
import { OBJECTIVE_STATUS } from '../lib/constants';

const STATUS_OPTIONS = OBJECTIVE_STATUS.map((s) => ({ value: s.id, label: s.label }));

export function ThinkerPage(): React.JSX.Element {
  const {
    activeMember, targets, mode, setMode, objectives, suggestions, thinking,
    title, setTitle, target, setTarget, focus, memberName, grouped,
    addObjective, setStatus, removeObjective, track, logSuggestion, loadSuggestions,
  } = useThinker();

  const targetOptions = targets.map((t) => ({ value: t.id, label: t.id }));

  return (
    <Page width="wide">
      <PageHeader
        title="Task Thinker"
        description="Suggestions and objectives drawn from IPCR targets and recent logged work."
        actions={
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[{ value: 'you', label: 'You' }, { value: 'team', label: 'Team' }]}
          />
        }
      />

      {focus.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          <Target className="size-4 text-accent" />
          <span className="text-muted">Focus areas {mode === 'team' ? 'for the team' : ''}:</span>
          {focus.map((f) => (
            <Badge key={f} tone="accent">{f}</Badge>
          ))}
          <span className="text-faint">least covered this cutoff</span>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line p-4">
            <CardHeader title="Objectives" description={mode === 'you' ? `Tracked for ${activeMember.name}` : 'Across the whole team'} />
            <form onSubmit={(e) => { void addObjective(e); }} className="mt-3 flex flex-wrap gap-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`New objective for ${activeMember.name.split(' ')[0]}`} className="min-w-48 flex-1" aria-label="Objective title" />
              <Select value={target} onChange={setTarget} options={targetOptions} className="w-36" aria-label="Target" />
              <Button type="submit" variant="primary">
                <Plus className="size-4" /> Add
              </Button>
            </form>
          </div>

          {objectives.length === 0 ? (
            <EmptyState icon={Target} title="No objectives yet" hint="Add one above, or track a suggestion from the right." />
          ) : (
            <div className="divide-y divide-line">
              {grouped.map(([mid, list]) => (
                <div key={mid}>
                  {mode === 'team' && <div className="bg-panel/50 px-5 py-1.5 text-xs font-medium text-subtle">{memberName(mid)}</div>}
                  <ul className="divide-y divide-line">
                    {list.map((o) => (
                      <li key={o.id} className="group flex items-center gap-3 px-5 py-3">
                        <Select value={o.status} onChange={(v) => { void setStatus(o, v); }} options={STATUS_OPTIONS} className="w-32" aria-label="Status" />
                        <div className="min-w-0 flex-1">
                          <p className={o.status === 'done' ? 'text-sm text-muted line-through' : 'text-sm text-ink'}>{o.title}</p>
                          {o.targetCode && <CodeTag className="mt-1">{o.targetCode}</CodeTag>}
                        </div>
                        <div className="hidden w-20 sm:block">
                          <Progress value={o.progress} tone={o.status === 'done' ? 'sage' : 'accent'} />
                        </div>
                        <button
                          type="button"
                          aria-label="Delete objective"
                          onClick={() => { void removeObjective(o); }}
                          className="rounded-md p-1 text-faint opacity-0 transition hover:bg-danger-soft hover:text-danger focus-ring group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit overflow-hidden">
          <div className="flex items-center justify-between border-b border-line p-4">
            <CardHeader title="Suggestions" />
            <Button size="iconSm" variant="ghost" onClick={() => { void loadSuggestions(); }} loading={thinking} aria-label="Refresh suggestions">
              {!thinking && <RefreshCw className="size-4" />}
            </Button>
          </div>
          {suggestions.length === 0 ? (
            <EmptyState icon={Compass} title="No suggestions" hint="Log some work to get tailored ideas." />
          ) : (
            <ul className="divide-y divide-line">
              {suggestions.map((s) => (
                <li key={s.id} className="px-4 py-3.5">
                  <p className="text-sm leading-snug text-ink">{s.text}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <CodeTag>{s.targetCode}</CodeTag>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => { void logSuggestion(s); }}>Log</Button>
                      <Button size="sm" variant="soft" onClick={() => { void track(s); }}>Track</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
}
