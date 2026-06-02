import { Check, Clock, Compass, LayoutDashboard, ListChecks, Laptop, Settings, Users } from 'lucide-react';
import { Link, useRoute } from '../../router';
import { cn } from '../../lib/cn';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accomplishments', label: 'Accomplishments', icon: ListChecks },
  { to: '/wfh', label: 'WFH Log', icon: Laptop },
  { to: '/thinker', label: 'Task Thinker', icon: Compass },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/history', label: 'History', icon: Clock },
];

function NavItem({ to, label, icon: Icon, active }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
        active ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-surface hover:text-ink'
      )}
    >
      <Icon className="size-[1.125rem]" strokeWidth={active ? 2 : 1.75} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const route = useRoute();
  const isActive = (to) => route === to || route.startsWith(`${to}/`);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-panel sm:flex">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-on-accent">
          <Check className="size-4" strokeWidth={2.5} />
        </span>
        <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">CBS DO IT</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} active={isActive(item.to)} />
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <NavItem to="/settings" label="Settings" icon={Settings} active={isActive('/settings')} />
      </div>
    </aside>
  );
}
