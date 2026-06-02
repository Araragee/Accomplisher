import { cn } from '../../lib/cn';

// Soft tinted chips. Tones keep legible text by mixing the role color toward ink
// where the role is light (warn/info).
const tones = {
  neutral: 'bg-panel text-muted',
  sage: 'bg-sage-soft text-sage',
  accent: 'bg-accent-soft text-accent',
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-[color-mix(in_oklab,var(--warn)_72%,var(--ink))]',
  info: 'bg-[color-mix(in_oklab,var(--info)_14%,var(--surface))] text-[color-mix(in_oklab,var(--info)_78%,var(--ink))]',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone] || tones.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

const dotColors = {
  neutral: 'bg-faint',
  sage: 'bg-sage',
  accent: 'bg-accent',
  danger: 'bg-danger',
  warn: 'bg-warn',
  info: 'bg-info',
};

export function Dot({ tone = 'neutral', className }) {
  return <span className={cn('inline-block size-1.5 rounded-full', dotColors[tone] || dotColors.neutral, className)} />;
}

// Monospace code pill for IPCR target references.
export function CodeTag({ children, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md bg-panel px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted', className)}>
      {children}
    </span>
  );
}
