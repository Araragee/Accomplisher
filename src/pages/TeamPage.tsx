import React from 'react';
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { Page, PageHeader } from '../components/layout';
import { Avatar, Button, Card, EmptyState, Field, Input, Modal, Progress } from '../components/ui';
import { StatStrip } from '../components/features';
import { useTeam } from '../composables/useTeam';

export function TeamPage(): React.JSX.Element {
  const { members, period, rows, avgCoverage, teamHours, editing, setEditing, saveMember, removeMember, viewMember } = useTeam();

  return (
    <Page width="wide">
      <PageHeader
        title="Team"
        description={`Coverage this cutoff · ${period.label}`}
        actions={
          <Button variant="primary" onClick={() => setEditing({ name: '', role: '' })}>
            <Plus className="size-4" /> Add member
          </Button>
        }
      />

      <Card className="mt-6 p-5">
        <StatStrip
          stats={[
            { label: 'Members', value: members.length },
            { label: 'Avg coverage', value: `${avgCoverage}%`, sub: 'across targets' },
            { label: 'Team WFH hours', value: teamHours.toFixed(1), sub: 'this cutoff' },
          ]}
        />
      </Card>

      <div className="mt-4 space-y-3">
        {rows.map(({ member: m, coverage, logged }) => (
          <Card key={m.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar name={m.name} id={m.id} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{m.name}</p>
                <p className="truncate text-sm text-subtle">{m.role || 'No role set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:w-72">
              <div className="flex-1">
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-subtle">{coverage.metCount}/{coverage.targetCount} targets</span>
                  <span className="font-mono tabular-nums text-muted">{coverage.total.toFixed(1)}h</span>
                </div>
                <Progress value={coverage.overallPct} />
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold tabular-nums text-ink">{logged}</div>
                <div className="text-xs text-subtle">logged</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:justify-end">
              <Button size="sm" variant="secondary" onClick={() => viewMember(m)}>View</Button>
              <Button size="iconSm" variant="ghost" aria-label="Edit" onClick={() => setEditing({ id: m.id, name: m.name, role: m.role || '', created_at: m.created_at || m.createdAt })}>
                <Pencil className="size-4" />
              </Button>
              <Button
                size="iconSm"
                variant="ghost"
                aria-label="Remove"
                disabled={m.id === 'me'}
                onClick={() => { void removeMember(m); }}
                className="hover:bg-danger-soft hover:text-danger disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </Card>
        ))}

        {members.length === 0 && (
          <Card>
            <EmptyState icon={UserRound} title="No team members" hint="Add the people whose accomplishments you manage." />
          </Card>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit member' : 'Add member'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { void saveMember(); }}>Save</Button>
          </>
        }
      >
        {editing && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void saveMember(); }}>
            <Field label="Name">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Full name" autoFocus />
            </Field>
            <Field label="Role" hint="Shown on the team roster and reports.">
              <Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="e.g. Data Analyst" />
            </Field>
          </form>
        )}
      </Modal>
    </Page>
  );
}
