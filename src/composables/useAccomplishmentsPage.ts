import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAccomplishments } from '../hooks/useEntries';
import { useConfirm } from '../components/ui';
import { currentCutoffPeriod, type Period } from '../lib/periods';
import { buildReport, slugify } from '../lib/export';
import { todayISO } from '../lib/format';
import type { Accomplishment, Member } from '../types';

const clampDate = (iso: string, s: string, e: string): string => (iso < s ? s : iso > e ? e : iso);

export interface UseAccomplishmentsPageResult {
  activeMember: Member;
  period: Period;
  setPeriod: React.Dispatch<React.SetStateAction<Period>>;
  items: Accomplishment[];
  loading: boolean;
  grouped: Array<[string, Accomplishment[]]>;
  report: string;
  filename: string;
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  editing: Accomplishment | null;
  setEditing: React.Dispatch<React.SetStateAction<Accomplishment | null>>;
  submit: (e: React.FormEvent) => Promise<void>;
  saveEdit: () => Promise<void>;
  confirmDelete: (id: string) => Promise<void>;
}

export function useAccomplishmentsPage(): UseAccomplishmentsPageResult {
  const { activeMember, activeMemberId } = useApp();
  const [period, setPeriod] = useState<Period>(() => currentCutoffPeriod());
  const { items, loading, add, update, remove } = useAccomplishments({ memberId: activeMemberId, period });
  const confirm = useConfirm();

  const [text, setText] = useState('');
  const [category, setCategory] = useState('Dev');
  const [date, setDate] = useState(() => clampDate(todayISO(), period.startISO, period.endISO));
  const [editing, setEditing] = useState<Accomplishment | null>(null);

  useEffect(() => {
    setDate((d) => clampDate(d, period.startISO, period.endISO));
  }, [period.startISO, period.endISO]);

  const grouped = useMemo<Array<[string, Accomplishment[]]>>(() => {
    const m = new Map<string, Accomplishment[]>();
    items.forEach((e) => {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    });
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  const report = useMemo(
    () => buildReport({ kind: 'payroll', memberName: activeMember.name, periodLabel: period.label, items }),
    [activeMember.name, period.label, items]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText('');
    await add({ text: v, category, date });
  };

  const saveEdit = async () => {
    if (!editing || !editing.text.trim()) return;
    await update(editing.id, { text: editing.text.trim(), category: editing.category, date: editing.date });
    setEditing(null);
  };

  const confirmDelete = async (id: string) => {
    if (await confirm({ title: 'Delete this entry?', confirmLabel: 'Delete', danger: true })) {
      await remove(id);
    }
  };

  return {
    activeMember,
    period,
    setPeriod,
    items,
    loading,
    grouped,
    report,
    filename: `accomplishments-${slugify(period.label)}.md`,
    text,
    setText,
    category,
    setCategory,
    date,
    setDate,
    editing,
    setEditing,
    submit,
    saveEdit,
    confirmDelete,
  };
}
