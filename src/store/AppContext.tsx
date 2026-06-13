import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as db from '../lib/db';
import type { Member, Target } from '../types';

export interface AppContextValue {
  ready: boolean;
  members: Member[];
  targets: Target[];
  activeMemberId: string;
  activeMember: Member;
  theme: string;
  setActiveMemberId: (id: string) => void;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  reloadMembers: () => Promise<void>;
  reloadTargets: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [activeMemberId, setActiveMemberIdState] = useState('me');
  const [theme, setThemeState] = useState('light');

  const reloadMembers = useCallback(async () => {
    setMembers(await db.listMembers());
  }, []);

  const reloadTargets = useCallback(async () => {
    setTargets(await db.listTargets());
  }, []);

  // Boot: init backend, hydrate members/targets/settings.
  useEffect(() => {
    let alive = true;
    (async () => {
      await db.init();
      const [m, t] = await Promise.all([db.listMembers(), db.listTargets()]);
      if (!alive) return;
      const settings = db.getSettings();
      setMembers(m);
      setTargets(t);
      const savedActive = settings.activeMemberId;
      setActiveMemberIdState(savedActive && m.some((x) => x.id === savedActive) ? savedActive : 'me');
      setThemeState(settings.theme === 'dark' ? 'dark' : 'light');
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Apply theme to <html>.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setActiveMemberId = useCallback((id: string) => {
    setActiveMemberIdState(id);
    db.saveSettings({ activeMemberId: id });
  }, []);

  const setTheme = useCallback((next: string) => {
    setThemeState(next);
    db.saveSettings({ theme: next });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      db.saveSettings({ theme: next });
      return next;
    });
  }, []);

  const activeMember = useMemo<Member>(
    () => members.find((m) => m.id === activeMemberId) || members[0] || { id: 'me', name: 'You', role: 'Owner' },
    [members, activeMemberId]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      members,
      targets,
      activeMemberId,
      activeMember,
      theme,
      setActiveMemberId,
      setTheme,
      toggleTheme,
      reloadMembers,
      reloadTargets,
    }),
    [ready, members, targets, activeMemberId, activeMember, theme, setActiveMemberId, setTheme, toggleTheme, reloadMembers, reloadTargets]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
