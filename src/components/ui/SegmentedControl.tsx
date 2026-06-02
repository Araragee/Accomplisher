import React from 'react';
import { cn } from '../../lib/cn';

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl({ options, value, onChange, size = 'md', className }: SegmentedControlProps): React.JSX.Element {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-line bg-panel p-1', className)} role="tablist">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md font-medium transition-colors duration-150 focus-ring',
              size === 'sm' ? 'h-7 px-3 text-xs' : 'h-8 px-3.5 text-[0.8125rem]',
              active
                ? 'bg-surface text-ink shadow-[0_1px_2px_oklch(0.3_0.02_150/0.10)]'
                : 'text-muted hover:text-ink'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
