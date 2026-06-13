import React, { useState } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem, Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Check, Clock, Compass, LayoutDashboard, ListChecks, Laptop, Settings, Users, Plus, ChevronUp, Moon, Sun, type LucideIcon } from 'lucide-react';
import { Link, useRoute, navigate } from '../../router';
import { cn } from '../../lib/cn';
import { useApp } from '../../store/AppContext';
import { useDashboard } from '../../composables/useDashboard';
import { WorkloadSparkline } from '../features';
import { Avatar, Input, Textarea, Select, Field } from '../ui';
import { CATEGORIES } from '../../lib/constants';
import { todayISO } from '../../lib/format';
import type { Period } from '../../lib/periods';

interface NavItemData {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItemData[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accomplishments', label: 'Accomplishments', icon: ListChecks },
  { to: '/wfh', label: 'WFH Log', icon: Laptop },
  { to: '/thinker', label: 'Task Thinker', icon: Compass },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/history', label: 'History', icon: Clock },
];

interface NavItemProps extends NavItemData {
  active: boolean;
}

function NavItem({ to, label, icon: Icon, active }: NavItemProps): React.JSX.Element {
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

export function Sidebar(): React.JSX.Element {
  const route = useRoute();
  const isActive = (to: string) => route === to || route.startsWith(`${to}/`);
  const { members, activeMember, activeMemberId, setActiveMemberId, theme, toggleTheme } = useApp();
  const { recent, coverage, sparkline, addAccomplishment, period } = useDashboard({ withSuggestions: false });
  
  const hasTrend = sparkline.some((d) => d.hours > 0);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-panel sm:flex sm:my-4 sm:ml-4 sm:mr-2 sm:rounded-3xl sm:border sm:border-line sm:shadow-soft overflow-hidden">
      {/* Brand Header */}
      <div className="flex h-14 items-center gap-2.5 px-5 shrink-0 border-b border-line/40">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-on-accent">
          <Check className="size-4" strokeWidth={2.5} />
        </span>
        <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">CBS DO IT</span>
      </div>

      {/* Navigation + Cards area (scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </nav>

        {/* Stats and Quick Add Card */}
        <div className="rounded-2xl border border-line bg-surface p-4 space-y-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-line pb-1.5">
              <span className="text-subtle">Logged</span>
              <span className="font-semibold text-ink">{recent.length} <span className="text-faint font-normal">items</span></span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-line pb-1.5">
              <span className="text-subtle">WFH Hours</span>
              <span className="font-semibold text-ink">{coverage.total.toFixed(1)} <span className="text-faint font-normal">/ {coverage.required}h</span></span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-subtle">Targets Met</span>
              <span className="font-semibold text-ink">{coverage.metCount} <span className="text-faint font-normal">/ {coverage.targetCount}</span></span>
            </div>
          </div>

          {hasTrend && (
            <div className="pt-2 border-t border-line">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-faint font-semibold">WFH Trend</div>
              <WorkloadSparkline data={sparkline} height={40} />
            </div>
          )}

          <Popover className="relative pt-2 border-t border-line">
            {({ close }) => (
              <>
                <PopoverButton className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-on-accent hover:bg-accent-hover active:bg-accent-active transition-colors focus-ring cursor-pointer">
                  <Plus className="size-4" strokeWidth={2.5} />
                  <span>Log Accomplishment</span>
                </PopoverButton>

                <PopoverPanel
                  anchor="right start"
                  transition
                  className="z-50 w-80 rounded-2xl border border-line bg-raised p-4 shadow-soft transition duration-150 ease-out [--anchor-gap:0.75rem] data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                  <AddAccomplishmentForm
                    close={close}
                    addAccomplishment={addAccomplishment}
                    period={period}
                  />
                </PopoverPanel>
              </>
            )}
          </Popover>
        </div>
      </div>

      {/* User and Settings Button Menu Dropdown */}
      <div className="border-t border-line px-3 py-3 shrink-0 bg-panel">
        <Menu as="div" className="relative">
          <MenuButton className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface p-2 text-sm transition-colors hover:border-line-strong focus-ring cursor-pointer">
            <Avatar name={activeMember.name} id={activeMember.id} size="sm" />
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs font-semibold text-ink truncate">{activeMember.name}</div>
              <div className="text-[10px] text-muted truncate">{activeMember.role || 'Member'}</div>
            </div>
            <ChevronUp className="size-4 text-subtle" />
          </MenuButton>

          <MenuItems
            anchor="top start"
            transition
            className="z-50 w-58 origin-bottom-left rounded-2xl border border-line bg-raised p-1.5 shadow-soft transition duration-150 ease-out [--anchor-gap:0.5rem] data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="px-2.5 py-1.5 text-xs border-b border-line mb-1 shrink-0">
              <span className="block text-faint font-medium">Logged in as</span>
              <span className="block font-semibold text-ink truncate mt-0.5">{activeMember.name}</span>
            </div>

            <MenuItem>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink transition-colors data-[focus]:bg-panel cursor-pointer"
              >
                <Settings className="size-3.5 text-muted" />
                <span>Settings</span>
              </button>
            </MenuItem>

            <MenuItem>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink transition-colors data-[focus]:bg-panel cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="size-3.5 text-muted" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="size-3.5 text-muted" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </MenuItem>

            <MenuItem>
              <button
                type="button"
                onClick={() => navigate('/team')}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink transition-colors data-[focus]:bg-panel cursor-pointer"
              >
                <Users className="size-3.5 text-muted" />
                <span>Manage Team</span>
              </button>
            </MenuItem>

            <div className="border-t border-line my-1.5" />
            <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Switch User</p>
            
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {members.map((m) => (
                <MenuItem key={m.id}>
                  <button
                    type="button"
                    onClick={() => setActiveMemberId(m.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors data-[focus]:bg-panel cursor-pointer"
                  >
                    <Avatar name={m.name} id={m.id} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">{m.name}</span>
                    {m.id === activeMemberId && <Check className="size-3.5 text-accent shrink-0" />}
                  </button>
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Menu>
      </div>
    </aside>
  );
}

interface AddAccomplishmentFormProps {
  close: () => void;
  addAccomplishment: (data: { text: string; category: string; date: string; id?: string }) => Promise<unknown>;
  period: Period;
}

function AddAccomplishmentForm({ close, addAccomplishment, period }: AddAccomplishmentFormProps): React.JSX.Element {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Dev');
  const [date, setDate] = useState(todayISO());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    await addAccomplishment({ text: v, category, date });
    setText('');
    close();
  };

  const categoryOptions = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="text-xs font-semibold text-ink border-b border-line pb-1.5 mb-2">
        New Accomplishment
      </div>

      <Field label="What did you accomplish?">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Optimized database query performance"
          autoFocus
          className="text-xs py-1.5"
          rows={2}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Category/Objective">
          <Select
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            className="h-8 text-xs pl-2 pr-1.5"
          />
        </Field>

        <Field label="Date">
          <Input
            type="date"
            value={date}
            min={period.startISO}
            max={period.endISO}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 text-xs px-2"
            required
          />
        </Field>
      </div>

      <div className="flex justify-end gap-1.5 pt-2 border-t border-line">
        <button
          type="button"
          onClick={close}
          className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-panel hover:text-ink transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent hover:bg-accent-hover active:bg-accent-active transition-colors focus-ring cursor-pointer"
        >
          Add
        </button>
      </div>
    </form>
  );
}
