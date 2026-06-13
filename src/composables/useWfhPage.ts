import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useWfh } from '../hooks/useEntries';
import { useConfirm } from '../components/ui';
import { computeCoverage, type CoverageResult } from '../lib/coverage';
import { currentCutoffPeriod, type Period } from '../lib/periods';
import { buildReport, slugify } from '../lib/export';
import { todayISO } from '../lib/format';
import type { WfhLog, Target, Member } from '../types';

const clampDate = (iso: string, s: string, e: string): string => (iso < s ? s : iso > e ? e : iso);

export interface UseWfhPageResult {
  activeMember: Member;
  targets: Target[];
  period: Period;
  setPeriod: React.Dispatch<React.SetStateAction<Period>>;
  items: WfhLog[];
  loading: boolean;
  coverage: CoverageResult;
  report: string;
  filename: string;
  output: string;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
  targetCode: string;
  setTargetCode: React.Dispatch<React.SetStateAction<string>>;
  hours: string;
  setHours: React.Dispatch<React.SetStateAction<string>>;
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  editing: WfhLog | null;
  setEditing: React.Dispatch<React.SetStateAction<WfhLog | null>>;
  submit: (e: React.FormEvent) => Promise<void>;
  saveEdit: () => Promise<void>;
  confirmDelete: (id: string) => Promise<void>;
}

export function useWfhPage(): UseWfhPageResult {
  const { activeMember, activeMemberId, targets } = useApp();
  const [period, setPeriod] = useState<Period>(() => currentCutoffPeriod());
  const { items, loading, add, update, remove } = useWfh({ memberId: activeMemberId, period });
  const confirm = useConfirm();

  const [output, setOutput] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [hours, setHours] = useState('8.0');
  const [date, setDate] = useState(() => clampDate(todayISO(), period.startISO, period.endISO));
  const [editing, setEditing] = useState<WfhLog | null>(null);

  useEffect(() => {
    if (!targetCode && targets.length && targets[0]) setTargetCode(targets[0].id);
  }, [targets, targetCode]);

  useEffect(() => {
    setDate((d) => clampDate(d, period.startISO, period.endISO));
  }, [period.startISO, period.endISO]);

  const coverage = useMemo(() => computeCoverage(items, targets), [items, targets]);
  const report = useMemo(
    () => buildReport({ kind: 'wfh', memberName: activeMember.name, periodLabel: period.label, items }),
    [activeMember.name, period.label, items]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = output.trim();
    if (!v || !targetCode) return;
    setOutput('');
    await add({ output: v, targetCode, hours, date });
  };

  const saveEdit = async () => {
    if (!editing || !editing.output.trim() || !editing.targetCode) return;
    await update(editing.id, {
      output: editing.output.trim(),
      hours: editing.hours,
      targetCode: editing.targetCode,
      date: editing.date,
    });
    setEditing(null);
  };

  const confirmDelete = async (id: string) => {
    if (await confirm({ title: 'Delete this log?', confirmLabel: 'Delete', danger: true })) {
      await remove(id);
    }
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
    editing,
    setEditing,
    submit,
    saveEdit,
    confirmDelete,
  };
}
