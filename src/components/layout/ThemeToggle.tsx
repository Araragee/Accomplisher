import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useApp();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light' : 'Switch to dark'}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink focus-ring"
    >
      {dark ? <Sun className="size-[1.125rem]" /> : <Moon className="size-[1.125rem]" />}
    </button>
  );
}
