import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useAccomplishments } from '../hooks/useEntries';
import { useConfirm } from '../components/ui';
import { currentCutoffPeriod } from '../lib/periods';
import { buildReport, slugify } from '../lib/export';
import { todayISO } from '../lib/format';

const clampDate = (iso, s, e) => (iso < s ? s : iso > e ? e : iso);

export function useAccomplishmentsPage() {
  const { activeMember, activeMemberId } = useApp();
  const [period, setPeriod] = useState(() => currentCutoffPeriod());
  const { items, loading, add, remove } = useAccomplishments({ memberId: activeMemberId, period });
  const confirm = useConfirm();

  const [text, setText] = useState('');
  const [category, setCategory] = useState('Dev');
  const [date, setDate] = useState(() => clampDate(todayISO(), period.startISO, period.endISO));

  useEffect(() => {
    setDate((d) => clampDate(d, period.startISO, period.endISO));
  }, [period.startISO, period.endISO]);

  const grouped = useMemo(() => {
    const m = new Map();
    items.forEach((e) => {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date).push(e);
    });
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  const report = useMemo(
    () => buildReport({ kind: 'payroll', memberName: activeMember.name, periodLabel: period.label, items }),
    [activeMember.name, period.label, items]
  );

  const submit = async (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setText('');
    await add({ text: v, category, date });
  };

  const confirmDelete = async (id) => {
    if (await confirm({ title: 'Delete this entry?', confirmLabel: 'Delete', danger: true })) remove(id);
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
    submit,
    confirmDelete,
  };
}
