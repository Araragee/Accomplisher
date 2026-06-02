import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge class names; conflicting Tailwind utilities resolve last-wins so callers
// can override a component's defaults (e.g. pass `p-6` over a default `p-4`).
export function cn(...parts) {
  return twMerge(clsx(parts));
}
