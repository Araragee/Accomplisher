import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useCutoffTrend } from './useCutoffTrend';

export function useHistory() {
  const { activeMember, activeMemberId } = useApp();
  const { rows } = useCutoffTrend({ memberId: activeMemberId, count: 8 });
  const list = [...rows].reverse(); // newest first for the list
  const trend = rows.map((r) => ({ label: r.label, coverage: r.coveragePct }));
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (expanded === null && list.length) setExpanded(list[0].key);
  }, [list, expanded]);

  return { activeMember, list, trend, expanded, setExpanded };
}
