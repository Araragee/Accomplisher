import React from 'react';
import { ArrowRight, Compass, Plus } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Badge, Card, CardHeader, Dot, EmptyState, Progress } from '../components/ui';
import { CoveragePanel } from '../components/features';
import { Link } from '../router';
import { useDashboard } from '../composables/useDashboard';
import { categoryMeta } from '../lib/constants';
import { fmtDate } from '../lib/format';

export function DashboardPage(): React.JSX.Element {
  const { activeMember, period, left, greeting, recent, coverage, suggestions, addSuggestion } = useDashboard();

  return (
    <Page>
      <PageHeader
        title={`${greeting}, ${activeMember.name.split(' ')[0]}`}
        description={`Cutoff ${period.tab} · ${period.label} · ${left} ${left === 1 ? 'day' : 'days'} left`}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <CardHeader title="Recent" />
            <Link to="/accomplishments" className="flex items-center gap-1 text-sm text-accent hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No accomplishments yet this cutoff" hint="Add one above to get started." />
          ) : (
            <ul className="divide-y divide-line">
              {recent.slice(0, 6).map((e) => {
                const meta = categoryMeta(e.category);
                return (
                  <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                    <Dot tone={meta.tone} className="mt-1.5" />
                    <p className="flex-1 text-sm text-ink">{e.text}</p>
                    <span className="shrink-0 text-xs text-faint">{fmtDate(e.date, 'MMM d')}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader title="IPCR coverage" description={`${coverage.metCount} of ${coverage.targetCount} met`} />
            <div className="mt-4">
              <CoveragePanel coverage={coverage} />
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <Progress value={coverage.overallPct} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <CardHeader title="Suggested next" />
              <Link to="/thinker" className="text-subtle hover:text-ink" title="Open Task Thinker">
                <Compass className="size-4" />
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {suggestions.length === 0 && <li className="text-sm text-faint">Nothing to suggest right now.</li>}
              {suggestions.map((s) => (
                <li key={s.id} className="flex items-start gap-2.5">
                  <button
                    type="button"
                    aria-label="Add suggestion"
                    onClick={() => { void addSuggestion(s); }}
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-accent-soft text-accent transition hover:bg-accent hover:text-on-accent focus-ring"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <span className="flex-1 text-sm leading-snug text-ink">
                    {s.text}
                    <Badge tone="neutral" className="ml-1.5 align-middle">{s.targetCode}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </Page>
  );
}
