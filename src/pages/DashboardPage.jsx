import { ArrowRight, Compass, Plus } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Badge, Button, Card, CardHeader, Dot, EmptyState, Input, Progress } from '../components/ui';
import { CoveragePanel, StatStrip, WorkloadSparkline } from '../components/features';
import { Link } from '../router';
import { useDashboard } from '../composables/useDashboard';
import { categoryMeta } from '../lib/constants';
import { fmtDate } from '../lib/format';

export function DashboardPage() {
  const { activeMember, period, left, greeting, recent, coverage, sparkline, quick, setQuick, submitQuick, suggestions, addSuggestion } = useDashboard();
  const hasTrend = sparkline.some((d) => d.hours > 0);

  return (
    <Page>
      <PageHeader
        title={`${greeting}, ${activeMember.name.split(' ')[0]}`}
        description={`Cutoff ${period.tab} · ${period.label} · ${left} ${left === 1 ? 'day' : 'days'} left`}
      />

      <Card className="mt-6 p-5">
        <StatStrip
          stats={[
            { label: 'Logged this cutoff', value: recent.length, sub: 'accomplishments' },
            { label: 'WFH hours', value: coverage.total.toFixed(1), sub: `of ${coverage.required} target` },
            { label: 'Targets met', value: `${coverage.metCount}/${coverage.targetCount}`, sub: 'IPCR coverage' },
          ]}
        />
        {hasTrend && (
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-1 text-xs text-subtle">WFH hours · recent cutoffs</div>
            <WorkloadSparkline data={sparkline} />
          </div>
        )}
        <form onSubmit={submitQuick} className="mt-5 flex gap-2 border-t border-line pt-5">
          <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add an accomplishment for today" className="flex-1" aria-label="Quick add" />
          <Button type="submit" variant="primary">
            <Plus className="size-4" /> Add
          </Button>
        </form>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
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
                    onClick={() => addSuggestion(s)}
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
