import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { computeCoverage, type CoverageResult } from '../lib/coverage';
import { currentCutoffPeriod, stepCutoff, type Period } from '../lib/periods';
import { fmtDate } from '../lib/format';
import * as db from '../lib/db';
import type { Accomplishment, WfhLog } from '../types';

export interface CutoffTrendRow {
  key: string;
  label: string;
  period: Period;
  accItems: Accomplishment[];
  wfhItems: WfhLog[];
  coverage: CoverageResult;
  hours: number;
  coveragePct: number;
  accCount: number;
}

export interface UseCutoffTrendParams {
  memberId: string;
  count?: number;
}

export interface UseCutoffTrendResult {
  rows: CutoffTrendRow[];
  periods: Period[];
}

// Loads the last `count` cutoffs for a member (oldest -> newest), with logged
// accomplishments, WFH, coverage and hours per cutoff. Shared by the Dashboard
// sparkline and the History page.
export function useCutoffTrend({ memberId, count = 6 }: UseCutoffTrendParams): UseCutoffTrendResult {
  const { targets } = useApp();

  const periods = useMemo(() => {
    const arr: Period[] = [];
    let p = currentCutoffPeriod();
    for (let i = 0; i < count; i += 1) {
      arr.push(p);
      p = stepCutoff(p, -1);
    }
    return arr.reverse();
  }, [count]);

  const [rows, setRows] = useState<CutoffTrendRow[]>([]);

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
