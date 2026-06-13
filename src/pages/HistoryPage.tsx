import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Card, CardHeader, Dot } from '../components/ui';
import { ExportButtons, CoverageTrend } from '../components/features';
import { useHistory } from '../composables/useHistory';
import { categoryMeta } from '../lib/constants';
import { buildReport, slugify } from '../lib/export';
import { fmtDate } from '../lib/format';

export function HistoryPage(): React.JSX.Element {
  const { activeMember, list, trend, expanded, setExpanded } = useHistory();
  const hasTrend = trend.some((d) => d.coverage > 0);

  return (
    <Page>
      <PageHeader title="History" description={`Past cutoffs for ${activeMember.name}`} />

      {hasTrend && (
        <Card className="mt-4 p-4">
          <CardHeader title="IPCR coverage trend" description="Percent of committed hours met per cutoff" />
          <div className="mt-4">
            <CoverageTrend data={trend} />
          </div>
        </Card>
      )}

      <div className="mt-4 space-y-3">
        {list.map((row) => {
          const { period: p, coverage, accItems } = row;
          const isOpen = expanded === p.key;
          return (
            <Card key={p.key} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : p.key)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-ring"
                >
                  {isOpen ? <ChevronDown className="size-4 text-subtle" /> : <ChevronRight className="size-4 text-subtle" />}
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      Cutoff {p.tab} <span className="font-normal text-faint">· {p.label}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-subtle">
                      {accItems.length} accomplishments · {coverage.total.toFixed(1)}h WFH · {coverage.metCount}/{coverage.targetCount} targets met
                    </p>
                  </div>
                </button>
                <ExportButtons
                  report={buildReport({ kind: 'payroll', memberName: activeMember.name, periodLabel: p.label, items: accItems })}
                  filename={`accomplishments-${slugify(p.label)}.md`}
                  disabled={accItems.length === 0}
                />
              </div>

              {isOpen && (
                <div className="border-t border-line px-4 py-3">
                  {accItems.length === 0 ? (
                    <p className="text-sm text-faint">No accomplishments logged this cutoff.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {accItems.map((e) => {
                        const meta = categoryMeta(e.category);
                        return (
                          <li key={e.id} className="flex items-start gap-3">
                            <Dot tone={meta.tone} className="mt-1.5" />
                            <p className="flex-1 text-sm text-ink">{e.text}</p>
                            <span className="shrink-0 text-xs text-faint">{fmtDate(e.date, 'MMM d')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
