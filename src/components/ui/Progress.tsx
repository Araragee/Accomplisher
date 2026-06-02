import React from 'react';
import { cn } from '../../lib/cn';

const fills = {
  accent: 'bg-accent',
  sage: 'bg-sage',
  warn: 'bg-warn',
  neutral: 'bg-line-strong',
} as const;

export type ProgressTone = keyof typeof fills;

export interface ProgressProps {
  value?: number;
  tone?: ProgressTone;
  className?: string;
}

export function Progress({ value = 0, tone, className }: ProgressProps): React.JSX.Element {
  const pct = Math.max(0, Math.min(100, value));
  const resolved = tone || (pct >= 67 ? 'sage' : pct >= 34 ? 'accent' : 'warn');
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-line overflow-hidden', className)}>
      <div
        className={cn('h-full w-full origin-left rounded-full transition-transform duration-500 ease-out', fills[resolved])}
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
}
