import React from 'react';
import { Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Badge, Button, Card, Dot, EmptyState, Field, Input, Modal, Select } from '../components/ui';
import { PeriodControl, ExportButtons } from '../components/features';
import { useAccomplishmentsPage } from '../composables/useAccomplishmentsPage';
import { CATEGORIES, categoryMeta } from '../lib/constants';
import { fmtDate } from '../lib/format';

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

export function AccomplishmentsPage(): React.JSX.Element {
  const {
    activeMember, period, setPeriod, items, loading, grouped, report, filename,
    text, setText, category, setCategory, date, setDate,
    editing, setEditing, submit, saveEdit, confirmDelete,
  } = useAccomplishmentsPage();

  return (
    <Page>
      <PageHeader
        title="Accomplishments"
        description={`${activeMember.name}${activeMember.role ? ` · ${activeMember.role}` : ''}`}
        actions={<ExportButtons report={report} filename={filename} disabled={items.length === 0} />}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PeriodControl period={period} onChange={setPeriod} />
        <span className="text-sm text-subtle">
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <Card className="mt-4 p-4">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you accomplish?" className="flex-1" aria-label="Accomplishment" />
          <div className="flex gap-2">
            <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-36 sm:w-40" aria-label="Category" />
            <Input type="date" value={date} min={period.startISO} max={period.endISO} onChange={(e) => setDate(e.target.value)} className="w-40" aria-label="Date" />
            <Button type="submit" variant="primary">
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-4 overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-panel" style={{ width: `${70 - i * 12}%` }} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing logged for this period yet"
            hint="Add what you finished above, or open Task Thinker for suggestions based on your targets."
          />
        ) : (
          <div className="divide-y divide-line">
            {grouped.map(([day, entries]) => (
              <div key={day} className="px-5 py-4">
                <div className="mb-2 text-xs font-medium text-subtle">{fmtDate(day, 'EEEE, MMM d')}</div>
                <ul className="space-y-1">
                  {entries.map((e) => {
                    const meta = categoryMeta(e.category);
                    return (
                      <li key={e.id} className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-panel/60">
                        <Dot tone={meta.tone} className="mt-1.5" />
                        <p className="flex-1 text-sm leading-relaxed text-ink">{e.text}</p>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <button
                          type="button"
                          aria-label="Edit entry"
                          onClick={() => setEditing(e)}
                          className="rounded-md p-1 text-faint opacity-0 transition hover:bg-panel hover:text-ink focus-ring group-hover:opacity-100"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete entry"
                          onClick={() => confirmDelete(e.id)}
                          className="rounded-md p-1 text-faint opacity-0 transition hover:bg-danger-soft hover:text-danger focus-ring group-hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit accomplishment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { void saveEdit(); }}>Save</Button>
          </>
        }
      >
        {editing && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void saveEdit(); }}>
            <Field label="Accomplishment">
              <Input value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} autoFocus />
            </Field>
            <div className="flex flex-wrap gap-3">
              <Field label="Category" className="flex-1">
                <Select value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} options={CATEGORY_OPTIONS} />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={editing.date}
                  min={period.startISO}
                  max={period.endISO}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="w-44"
                />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </Page>
  );
}
