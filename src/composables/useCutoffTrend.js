import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { computeCoverage } from '../lib/coverage';
import { currentCutoffPeriod, stepCutoff } from '../lib/periods';
import { fmtDate } from '../lib/format';
import * as db from '../lib/db';

// Loads the last `count` cutoffs for a member (oldest -> newest), with logged
// accomplishments, WFH, coverage and hours per cutoff. Shared by the Dashboard
// sparkline and the History page.
export function useCutoffTrend({ memberId, count = 6 }) {
  const { targets } = useApp();

  const periods = useMemo(() => {
    const arr = [];
    let p = currentCutoffPeriod();
    for (let i = 0; i < count; i += 1) {
      arr.push(p);
      p = stepCutoff(p, -1);
    }
    return arr.reverse();
  }, [count]);

  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await Promise.all(
        periods.map(async (p) => {
          const [accItems, wfhItems] = await Promise.all([
            db.listAccomplishments({ memberId, start: p.startISO, end: p.endISO }),
            db.listWfh({ memberId, start: p.startISO, end: p.endISO }),
          ]);
          const coverage = computeCoverage(wfhItems, targets);
          return {
            key: p.key,
            label: fmtDate(p.startISO, 'MMM d'),
            period: p,
            accItems,
            wfhItems,
            coverage,
            hours: coverage.total,
            coveragePct: Math.round(coverage.overallPct),
            accCount: accItems.length,
          };
        })
      );
      if (alive) setRows(data);
    })();
    return () => {
      alive = false;
    };
  }, [memberId, periods, targets]);

  return { rows, periods };
}
