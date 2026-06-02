import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAccomplishments, useWfh } from '../hooks/useEntries';
import { useCutoffTrend } from './useCutoffTrend';
import { computeCoverage, type CoverageResult } from '../lib/coverage';
import { currentCutoffPeriod, daysRemaining, type Period } from '../lib/periods';
import { TARGET_TO_CATEGORY } from '../lib/constants';
import { getPHTNow, todayISO } from '../lib/format';
import * as db from '../lib/db';
import type { Accomplishment, Suggestion, Member } from '../types';

function greeting(): string {
  const h = getPHTNow().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export interface SparklinePoint {
  label: string;
  hours: number;
}

export interface UseDashboardResult {
  activeMember: Member;
  period: Period;
  left: number;
  greeting: string;
  recent: Accomplishment[];
  coverage: CoverageResult;
  sparkline: SparklinePoint[];
  quick: string;
  setQuick: React.Dispatch<React.SetStateAction<string>>;
  submitQuick: (e: React.FormEvent) => Promise<void>;
  suggestions: Suggestion[];
  addSuggestion: (s: Suggestion) => Promise<Accomplishment>;
  addAccomplishment: (data: { text: string; category: string; date: string; id?: string }) => Promise<Accomplishment>;
}

export function useDashboard(): UseDashboardResult {
  const { activeMember, activeMemberId, targets } = useApp();
  const period = useMemo<Period>(() => currentCutoffPeriod(), []);
  const acc = useAccomplishments({ memberId: activeMemberId, period });
  const wfh = useWfh({ memberId: activeMemberId, period });
  const coverage = useMemo(() => computeCoverage(wfh.items, targets), [wfh.items, targets]);
  const { rows: trend } = useCutoffTrend({ memberId: activeMemberId, count: 6 });

  const [quick, setQuick] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    let alive = true;
    db.getSuggestions({ memberId: activeMemberId, mode: 'individual' })
      .then((s) => {
        if (alive) setSuggestions(s.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [activeMemberId, acc.items.length, wfh.items.length]);

  const submitQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = quick.trim();
    if (!v) return;
    setQuick('');
    await acc.add({ text: v, category: 'Dev', date: todayISO() });
  };

  const addSuggestion = (s: Suggestion) =>
    acc.add({
      text: s.text,
      category: TARGET_TO_CATEGORY[s.targetCode] || 'Other',
      date: todayISO(),
    });

  return {
    activeMember,
    period,
    left: daysRemaining(period.endISO),
    greeting: greeting(),
    recent: acc.items,
    coverage,
    sparkline: trend.map((r) => ({ label: r.label, hours: r.hours })),
    quick,
    setQuick,
    submitQuick,
    suggestions,
    addSuggestion,
    addAccomplishment: acc.add,
  };
}
