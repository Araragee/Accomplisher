import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 focus-ring disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap';

const sizes = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  icon: 'h-9 w-9',
  iconSm: 'h-8 w-8',
} as const;

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active',
  secondary: 'bg-surface text-ink border border-line hover:bg-panel hover:border-line-strong',
  ghost: 'text-muted hover:text-ink hover:bg-accent-soft',
  soft: 'bg-accent-soft text-accent hover:brightness-[0.97]',
  danger: 'text-danger border border-transparent hover:bg-danger-soft',
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  [key: string]: unknown;
}

export function Button({
  as: Comp = 'button',
  variant = 'secondary',
  size = 'md',
  className,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <Comp
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Comp>
  );
}
