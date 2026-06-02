import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useWfh } from '../hooks/useEntries';
import { useConfirm } from '../components/ui';
import { computeCoverage } from '../lib/coverage';
import { currentCutoffPeriod } from '../lib/periods';
import { buildReport, slugify } from '../lib/export';
import { todayISO } from '../lib/format';

const clampDate = (iso, s, e) => (iso < s ? s : iso > e ? e : iso);

export function useWfhPage() {
  const { activeMember, activeMemberId, targets } = useApp();
  const [period, setPeriod] = useState(() => currentCutoffPeriod());
  const { items, loading, add, remove } = useWfh({ memberId: activeMemberId, period });
  const confirm = useConfirm();

  const [output, setOutput] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [hours, setHours] = useState('8.0');
  const [date, setDate] = useState(() => clampDate(todayISO(), period.startISO, period.endISO));

  useEffect(() => {
    if (!targetCode && targets.length) setTargetCode(targets[0].id);
  }, [targets, targetCode]);

  useEffect(() => {
    setDate((d) => clampDate(d, period.startISO, period.endISO));
  }, [period.startISO, period.endISO]);

  const coverage = useMemo(() => computeCoverage(items, targets), [items, targets]);
  const report = useMemo(
    () => buildReport({ kind: 'wfh', memberName: activeMember.name, periodLabel: period.label, items }),
    [activeMember.name, period.label, items]
  );

  const submit = async (e) => {
    e.preventDefault();
    const v = output.trim();
    if (!v || !targetCode) return;
    setOutput('');
    await add({ output: v, targetCode, hours, date });
  };

  const confirmDelete = async (id) => {
    if (await confirm({ title: 'Delete this log?', confirmLabel: 'Delete', danger: true })) remove(id);
  };

  return {
    activeMember,
    targets,
    period,
    setPeriod,
    items,
    loading,
    coverage,
    report,
    filename: `wfh-${slugify(period.label)}.md`,
    output,
    setOutput,
    targetCode,
    setTargetCode,
    hours,
    setHours,
    date,
    setDate,
    submit,
    confirmDelete,
  };
}
