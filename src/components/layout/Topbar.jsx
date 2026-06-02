import { CalendarDays } from 'lucide-react';
import { MemberSwitcher } from './MemberSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { CUTOFFS, currentCutoffPeriod, daysRemaining } from '../../lib/periods';
import { navigate, useRoute } from '../../router';

const ROUTES = [
  ['/dashboard', 'Dashboard'],
  ['/accomplishments', 'Accomplishments'],
  ['/wfh', 'WFH Log'],
  ['/thinker', 'Task Thinker'],
  ['/team', 'Team'],
  ['/history', 'History'],
  ['/settings', 'Settings'],
];

export function Topbar() {
  const route = useRoute();
  const period = currentCutoffPeriod();
  const left = daysRemaining(period.endISO);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile route picker (sidebar is hidden below sm) */}
        <select
          value={ROUTES.some(([r]) => r === route) ? route : '/dashboard'}
          onChange={(e) => navigate(e.target.value)}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink focus-ring sm:hidden"
        >
          {ROUTES.map(([r, label]) => (
            <option key={r} value={r}>
              {label}
            </option>
          ))}
        </select>

        <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm sm:flex">
          <CalendarDays className="size-4 text-subtle" />
          <span className="text-muted">
            Cutoff {period.tab} <span className="text-faint">({CUTOFFS[period.tab].label})</span>
          </span>
          <span className="text-faint">·</span>
          <span className="font-medium text-ink">
            {left} {left === 1 ? 'day' : 'days'} left
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <MemberSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
