import { format as fmt } from 'date-fns';
import { toISO, getPHTNow } from './format';

export interface Period {
  type: 'cutoff' | 'custom';
  year?: number;
  month?: number;
  tab?: 'A' | 'B';
  startISO: string;
  endISO: string;
  label: string;
  key: string;
}

// Two semi-monthly payroll cutoffs plus an ad-hoc custom range.
//   A = 11th to 25th of the month
//   B = 26th to 10th of the following month
export const CUTOFFS = {
  A: { label: '11 – 25', short: 'A' },
  B: { label: '26 – 10', short: 'B' },
} as const;

function cutoffRange(year: number, month: number /* 1-12 */, tab: 'A' | 'B'): { start: Date; end: Date } {
  if (tab === 'A') {
    return { start: new Date(year, month - 1, 11), end: new Date(year, month - 1, 25) };
  }
  // B: 26th of this month to 10th of next month (JS Date handles year rollover).
  return { start: new Date(year, month - 1, 26), end: new Date(year, month, 10) };
}

function rangeLabel(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${fmt(start, 'MMM d')} – ${fmt(end, sameYear ? 'MMM d, yyyy' : 'MMM d, yyyy')}`;
}

export function cutoffKey(year: number, month: number, tab: 'A' | 'B'): string {
  return `${year}-${String(month).padStart(2, '0')}-${tab}`;
}

// Which cutoff does a given PHT date fall into?
export function determineCurrentPeriod(d: Date = getPHTNow()): { year: number; month: number; tab: 'A' | 'B' } {
  const day = d.getDate();
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  if (day >= 11 && day <= 25) return { year: y, month: m, tab: 'A' };
  if (day >= 26) return { year: y, month: m, tab: 'B' };
  // 1st to 10th belongs to the previous month's B cutoff.
  const prev = new Date(y, m - 2, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() + 1, tab: 'B' };
}

export function buildCutoffPeriod(year: number, month: number, tab: 'A' | 'B'): Period {
  const { start, end } = cutoffRange(year, month, tab);
  return {
    type: 'cutoff',
    year,
    month,
    tab,
    startISO: toISO(start),
    endISO: toISO(end),
    label: rangeLabel(start, end),
    key: cutoffKey(year, month, tab),
  };
}

export function buildCustomPeriod(startISO: string, endISO: string): Period {
  const s = new Date(startISO + 'T12:00:00');
  const e = new Date(endISO + 'T12:00:00');
  return {
    type: 'custom',
    startISO,
    endISO,
    label: rangeLabel(s, e),
    key: `custom-${startISO}_${endISO}`,
  };
}

export function currentCutoffPeriod(): Period {
  const { year, month, tab } = determineCurrentPeriod();
  return buildCutoffPeriod(year, month, tab);
}

// Step a cutoff period forward/backward through the A/B sequence.
export function stepCutoff(period: Period, dir: number): Period {
  let { year = 2026, month = 1, tab = 'A' } = period;
  if (dir > 0) {
    if (tab === 'A') tab = 'B';
    else {
      tab = 'A';
      month += 1;
      if (month > 12) { month = 1; year += 1; }
    }
  } else {
    if (tab === 'B') tab = 'A';
    else {
      tab = 'B';
      month -= 1;
      if (month < 1) { month = 12; year -= 1; }
    }
  }
  return buildCutoffPeriod(year, month, tab);
}

// Whole days from today (PHT) to the end of the period. Never negative.
export function daysRemaining(endISO: string): number {
  const end = new Date(endISO + 'T23:59:59');
  const now = getPHTNow();
  const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function isDateInPeriod(dateISO: string, period: Period): boolean {
  return dateISO >= period.startISO && dateISO <= period.endISO;
}
