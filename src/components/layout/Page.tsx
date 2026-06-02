import React from 'react';
import { cn } from '../../lib/cn';

export interface PageProps {
  children: React.ReactNode;
  width?: 'default' | 'wide' | 'narrow';
  className?: string;
}

export function Page({ children, width = 'default', className }: PageProps): React.JSX.Element {
  const max = width === 'wide' ? 'max-w-6xl' : width === 'narrow' ? 'max-w-3xl' : 'max-w-5xl';
  return <div className={cn('mx-auto w-full px-5 py-8 sm:px-8 sm:py-10', max, className)}>{children}</div>;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
