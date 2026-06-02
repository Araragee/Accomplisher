import React from 'react';
import { cn } from '../../lib/cn';

export interface StatItem {
  label: string;
  value: React.ReactNode;
  sub?: string;
}

export interface StatStripProps {
  stats: StatItem[];
  className?: string;
}

// A calm inline row of stats. Deliberately not a grid of identical metric cards.
export function StatStrip({ stats, className }: StatStripProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-wrap items-stretch gap-x-10 gap-y-5', className)}>
      {stats.map((s, i) => (
        <div key={i} className="min-w-20">
          <div className="text-xs text-subtle">{s.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-ink">{s.value}</div>
          {s.sub && <div className="mt-0.5 text-xs text-faint">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
