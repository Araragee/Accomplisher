import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAccomplishments, useWfh } from '../hooks/useEntries';
import { useCutoffTrend } from './useCutoffTrend';
import { computeCoverage } from '../lib/coverage';
import { currentCutoffPeriod, daysRemaining } from '../lib/periods';
import { TARGET_TO_CATEGORY } from '../lib/constants';
import { getPHTNow, todayISO } from '../lib/format';
import * as db from '../lib/db';

function greeting() {
  const h = getPHTNow().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function useDashboard() {
  const { activeMember, activeMemberId, targets } = useApp();
  const period = useMemo(() => currentCutoffPeriod(), []);
  const acc = useAccomplishments({ memberId: activeMemberId, period });
  const wfh = useWfh({ memberId: activeMemberId, period });
  const coverage = useMemo(() => computeCoverage(wfh.items, targets), [wfh.items, targets]);
  const { rows: trend } = useCutoffTrend({ memberId: activeMemberId, count: 6 });

  const [quick, setQuick] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    let alive = true;
    db.getSuggestions({ memberId: activeMemberId, mode: 'individual' })
      .then((s) => alive && setSuggestions(s.slice(0, 3)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [activeMemberId, acc.items.length, wfh.items.length]);

  const submitQuick = async (e) => {
    e.preventDefault();
    const v = quick.trim();
    if (!v) return;
    setQuick('');
    await acc.add({ text: v, category: 'Dev', date: todayISO() });
  };

  const addSuggestion = (s) => acc.add({ text: s.text, category: TARGET_TO_CATEGORY[s.targetCode] || 'Other', date: todayISO() });

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
  };
}
