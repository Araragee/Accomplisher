import { format as fmt } from 'date-fns';

// PSA runs on Philippine time (UTC+8). Compute "now" in PHT regardless of the
// machine timezone so cutoff math is stable.
export function getPHTNow(): Date {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 8);
}

// Date object -> 'yyyy-MM-dd'
export function toISO(d: Date): string {
  return fmt(d, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return toISO(getPHTNow());
}

// ISO date string -> human label. Anchor at noon to dodge DST/offset drift.
export function fmtDate(iso: string | null | undefined, pattern: string = 'MMM d, yyyy'): string {
  if (!iso) return '';
  return fmt(new Date(iso + 'T12:00:00'), pattern);
}

export function fmtTime(d: Date | number, pattern: string = 'h:mm a'): string {
  return fmt(d, pattern);
}

// "2h ago", "just now" for sync/save chips.
export function relativeFromNow(ms: number): string {
  const diff = getPHTNow().getTime() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return fmtDate(toISO(new Date(ms)));
}
