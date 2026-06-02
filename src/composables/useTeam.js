import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { navigate } from '../router';
import { useConfirm, useToast } from '../components/ui';
import { computeCoverage } from '../lib/coverage';
import { currentCutoffPeriod } from '../lib/periods';
import * as db from '../lib/db';

export function useTeam() {
  const { members, reloadMembers, targets, setActiveMemberId } = useApp();
  const period = useMemo(() => currentCutoffPeriod(), []);
  const confirm = useConfirm();
  const toast = useToast();

  const [wfhAll, setWfhAll] = useState([]);
  const [accAll, setAccAll] = useState([]);
  const [editing, setEditing] = useState(null);

  const loadTeamData = useCallback(async () => {
    const [w, a] = await Promise.all([
      db.listWfh({ memberId: 'all', start: period.startISO, end: period.endISO }),
      db.listAccomplishments({ memberId: 'all', start: period.startISO, end: period.endISO }),
    ]);
    setWfhAll(w);
    setAccAll(a);
  }, [period.startISO, period.endISO]);

  useEffect(() => { loadTeamData(); }, [loadTeamData, members.length]);

  const rows = useMemo(
    () =>
      members.map((m) => ({
        member: m,
        coverage: computeCoverage(wfhAll.filter((w) => w.memberId === m.id), targets),
        logged: accAll.filter((a) => a.memberId === m.id).length,
      })),
    [members, wfhAll, accAll, targets]
  );

  const avgCoverage = rows.length ? Math.round(rows.reduce((s, r) => s + r.coverage.overallPct, 0) / rows.length) : 0;
  const teamHours = wfhAll.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);

  const saveMember = async () => {
    if (!editing?.name.trim()) return;
    await db.saveMember({ id: editing.id || crypto.randomUUID(), name: editing.name.trim(), role: editing.role.trim(), created_at: editing.created_at });
    setEditing(null);
    await reloadMembers();
    toast(editing.id ? 'Member updated' : 'Member added');
  };

  const removeMember = async (m) => {
    if (
      await confirm({
        title: `Remove ${m.name}?`,
        message: 'Their accomplishments, WFH logs, and objectives will be deleted.',
        confirmLabel: 'Remove',
        danger: true,
      })
    ) {
      await db.deleteMember(m.id);
      await reloadMembers();
      toast('Member removed');
    }
  };

  const viewMember = (m) => {
    setActiveMemberId(m.id);
    navigate('/dashboard');
  };

  return { members, period, rows, avgCoverage, teamHours, editing, setEditing, saveMember, removeMember, viewMember };
}
