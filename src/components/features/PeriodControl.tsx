import React from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Input } from '../ui';
import { buildCustomPeriod, currentCutoffPeriod, stepCutoff, type Period } from '../../lib/periods';

export interface PeriodControlProps {
  period: Period;
  onChange: (period: Period) => void;
}

export function PeriodControl({ period, onChange }: PeriodControlProps): React.JSX.Element {
  const isCustom = period.type === 'custom';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isCustom ? (
        <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
          <button
            type="button"
            aria-label="Previous cutoff"
            onClick={() => onChange(stepCutoff(period, -1))}
            className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink focus-ring"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-1.5 text-sm">
            <span className="font-medium text-ink">Cutoff {period.tab}</span>
            <span className="text-faint"> · {period.label}</span>
          </span>
          <button
            type="button"
            aria-label="Next cutoff"
            onClick={() => onChange(stepCutoff(period, 1))}
            className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink focus-ring"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={period.startISO}
            max={period.endISO}
            onChange={(e) => onChange(buildCustomPeriod(e.target.value, period.endISO))}
            className="h-9 w-auto"
          />
          <span className="text-sm text-faint">to</span>
          <Input
            type="date"
            value={period.endISO}
            min={period.startISO}
            onChange={(e) => onChange(buildCustomPeriod(period.startISO, e.target.value))}
            className="h-9 w-auto"
          />
        </div>
      )}

      <Button
        variant={isCustom ? 'soft' : 'ghost'}
        size="sm"
        onClick={() => onChange(isCustom ? currentCutoffPeriod() : buildCustomPeriod(period.startISO, period.endISO))}
      >
        <CalendarRange className="size-4" />
        {isCustom ? 'Use cutoffs' : 'Custom range'}
      </Button>
    </div>
  );
}
