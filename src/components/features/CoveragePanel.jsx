import { Check } from 'lucide-react';
import { Progress } from '../ui';
import { cn } from '../../lib/cn';

export function CoveragePanel({ coverage, className }) {
  if (coverage.rows.length === 0) {
    return <p className="text-sm text-faint">No IPCR targets configured yet.</p>;
  }
  return (
    <div className={cn('space-y-4', className)}>
      {coverage.rows.map((r) => (
        <div key={r.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink">
              {r.met && <Check className="size-3.5 shrink-0 text-sage" strokeWidth={2.5} />}
              <span className="truncate" title={r.name}>{r.name}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
              {r.logged.toFixed(1)}/{r.required}h
            </span>
          </div>
          <Progress value={r.progress} />
        </div>
      ))}
    </div>
  );
}
