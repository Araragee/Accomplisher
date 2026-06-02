import { Laptop, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Button, Card, CardHeader, CodeTag, EmptyState, Input, Progress, Select } from '../components/ui';
import { PeriodControl, ExportButtons, CoveragePanel } from '../components/features';
import { useWfhPage } from '../composables/useWfhPage';
import { WFH_HOURS_OPTIONS } from '../lib/constants';
import { fmtDate } from '../lib/format';

const HOURS_OPTIONS = WFH_HOURS_OPTIONS.map((h) => ({ value: h, label: `${h} hrs` }));

export function WfhPage() {
  const {
    targets, period, setPeriod, items, loading, coverage, report, filename,
    output, setOutput, targetCode, setTargetCode, hours, setHours, date, setDate, submit, confirmDelete,
  } = useWfhPage();

  const targetOptions = targets.map((t) => ({ value: t.id, label: t.id }));

  return (
    <Page width="wide">
      <PageHeader
        title="WFH Log"
        description="Daily remote work output, tracked against IPCR hours"
        actions={<ExportButtons report={report} filename={filename} disabled={items.length === 0} />}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PeriodControl period={period} onChange={setPeriod} />
        <span className="text-sm text-subtle">
          <span className="font-medium tabular-nums text-ink">{coverage.total.toFixed(1)}</span> hours logged
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <form onSubmit={submit} className="flex flex-col gap-3">
              <Input value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Describe your remote work output" aria-label="Output" />
              <div className="flex flex-wrap gap-2">
                <Select value={targetCode} onChange={setTargetCode} options={targetOptions} className="min-w-36 flex-1" aria-label="Target" />
                <Select value={hours} onChange={setHours} options={HOURS_OPTIONS} className="w-28" aria-label="Hours" />
                <Input type="date" value={date} min={period.startISO} max={period.endISO} onChange={(e) => setDate(e.target.value)} className="w-40" aria-label="Date" />
                <Button type="submit" variant="primary">
                  <Plus className="size-4" /> Log
                </Button>
              </div>
            </form>
          </Card>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-panel" style={{ width: `${80 - i * 14}%` }} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Laptop}
                title="No WFH output logged yet"
                hint="Log what you worked on remotely and tag it to an IPCR target to track your hours."
              />
            ) : (
              <ul className="divide-y divide-line">
                {items.map((w) => (
                  <li key={w.id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-panel/60">
                    <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-subtle">{fmtDate(w.date, 'MMM d')}</span>
                    <p className="flex-1 text-sm text-ink">{w.output}</p>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{w.hours} hrs</span>
                    <CodeTag>{w.targetCode}</CodeTag>
                    <button
                      type="button"
                      aria-label="Delete log"
                      onClick={() => confirmDelete(w.id)}
                      className="rounded-md p-1 text-faint opacity-0 transition hover:bg-danger-soft hover:text-danger focus-ring group-hover:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit p-5">
          <CardHeader title="IPCR coverage" description={`${coverage.metCount} of ${coverage.targetCount} targets met`} />
          <div className="mt-4">
            <CoveragePanel coverage={coverage} />
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs text-subtle">Total this period</span>
              <span className="font-mono text-xs tabular-nums text-muted">
                {coverage.total.toFixed(1)}/{coverage.required}h
              </span>
            </div>
            <Progress value={coverage.overallPct} />
          </div>
        </Card>
      </div>
    </Page>
  );
}
