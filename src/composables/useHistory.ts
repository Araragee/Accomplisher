import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useCutoffTrend, type CutoffTrendRow } from './useCutoffTrend';
import type { Member } from '../types';

export interface HistoryTrendPoint {
  label: string;
  coverage: number;
}

export interface UseHistoryResult {
  activeMember: Member;
  list: CutoffTrendRow[];
  trend: HistoryTrendPoint[];
  expanded: string | null;
  setExpanded: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useHistory(): UseHistoryResult {
  const { activeMember, activeMemberId } = useApp();
  const { rows } = useCutoffTrend({ memberId: activeMemberId, count: 8 });
  const list = [...rows].reverse(); // newest first for the list
  const trend = rows.map((r) => ({ label: r.label, coverage: r.coveragePct }));
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (expanded === null && list.length && list[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(list[0].key);
    }
  }, [list, expanded]);

  return { activeMember, list, trend, expanded, setExpanded };
}
