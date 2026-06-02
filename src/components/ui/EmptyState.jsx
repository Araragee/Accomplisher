import { cn } from '../../lib/cn';

export function EmptyState({ icon: Icon, title, hint, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="mb-3 grid size-11 place-items-center rounded-full bg-panel text-subtle">
          <Icon className="size-5" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-muted">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-faint">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
