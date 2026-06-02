import React from 'react';
import { Database, HardDrive, Pencil, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Button, Card, CardHeader, Field, Input, SegmentedControl } from '../components/ui';
import { useSettings } from '../composables/useSettings';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps): React.JSX.Element {
  return (
    <Card className="p-5">
      <CardHeader title={title} description={description} />
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function SettingsPage(): React.JSX.Element {
  const {
    theme, setTheme, targets, isTauri, profile, setProfile, tForm, setTForm,
    saveProfile, saveTarget, editTarget, removeTarget, exportData, clearData,
  } = useSettings();

  return (
    <Page width="narrow">
      <PageHeader title="Settings" />

      <div className="mt-6 space-y-4">
        <Section title="Appearance" description="Light is calm and bright; dark is a warm dusk for long sessions.">
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
          />
        </Section>

        <Section title="Your profile" description="Used as the default member and on your reports.">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); void saveProfile(); }}>
            <Field label="Name" className="flex-1">
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Role" className="flex-1">
              <Input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} placeholder="e.g. Front-end Developer" />
            </Field>
            <Button type="submit" variant="primary">Save</Button>
          </form>
        </Section>

        <Section title="IPCR targets" description="Commitment hours the WFH log and Task Thinker track against.">
          <ul className="divide-y divide-line rounded-lg border border-line">
            {targets.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="font-mono text-xs text-accent">{t.id}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{t.name}</span>
                <span className="font-mono text-xs tabular-nums text-subtle">{t.requiredHours ?? t.required_hours}h</span>
                <button type="button" aria-label="Edit target" onClick={() => editTarget(t)} className="rounded-md p-1 text-faint hover:bg-panel hover:text-ink focus-ring">
                  <Pencil className="size-3.5" />
                </button>
                <button type="button" aria-label="Delete target" onClick={() => { void removeTarget(t.id); }} className="rounded-md p-1 text-faint hover:bg-danger-soft hover:text-danger focus-ring">
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            {targets.length === 0 && <li className="px-3 py-3 text-sm text-faint">No targets yet.</li>}
          </ul>

          <form onSubmit={(e) => { void saveTarget(e); }} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
            <Input value={tForm.id} onChange={(e) => setTForm({ ...tForm, id: e.target.value })} placeholder="IPCR-B-004" disabled={!!tForm.editingId} aria-label="Target code" />
            <Input value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} placeholder="Target name" aria-label="Target name" />
            <Input type="number" min="1" value={tForm.requiredHours} onChange={(e) => setTForm({ ...tForm, requiredHours: e.target.value })} className="w-24" aria-label="Required hours" />
            <Button type="submit" variant={tForm.editingId ? 'primary' : 'secondary'}>
              <Plus className="size-4" /> {tForm.editingId ? 'Update' : 'Add'}
            </Button>
          </form>
        </Section>

        <Section title="Data & storage">
          <div className="flex items-center gap-2 rounded-lg bg-panel px-3 py-2.5 text-sm text-muted">
            {isTauri ? <Database className="size-4 text-sage" /> : <HardDrive className="size-4 text-subtle" />}
            {isTauri ? 'Stored in a local database (SQLite) on this machine.' : 'Stored in browser storage (development mode).'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { void exportData(); }}>Export backup (.json)</Button>
            <Button variant="danger" onClick={() => { void clearData(); }}>Clear logged data</Button>
          </div>
        </Section>
      </div>
    </Page>
  );
}
