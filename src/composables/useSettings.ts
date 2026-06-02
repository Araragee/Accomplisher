import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useConfirm, useToast } from '../components/ui';
import * as db from '../lib/db';
import { downloadText } from '../lib/export';
import type { Member, Target } from '../types';

export interface ProfileForm {
  name: string;
  role: string;
}

export interface TargetForm {
  id: string;
  name: string;
  requiredHours: string;
  editingId: string | null;
}

export interface UseSettingsResult {
  theme: string;
  setTheme: (theme: string) => void;
  members: Member[];
  targets: Target[];
  isTauri: boolean;
  profile: ProfileForm;
  setProfile: React.Dispatch<React.SetStateAction<ProfileForm>>;
  tForm: TargetForm;
  setTForm: React.Dispatch<React.SetStateAction<TargetForm>>;
  saveProfile: () => Promise<void>;
  saveTarget: (e: React.FormEvent) => Promise<void>;
  editTarget: (t: Target) => void;
  removeTarget: (id: string) => Promise<void>;
  exportData: () => Promise<void>;
  clearData: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const { theme, setTheme, members, reloadMembers, targets, reloadTargets } = useApp();
  const confirm = useConfirm();
  const toast = useToast();

  const me = members.find((m) => m.id === 'me') || members[0];
  const [profile, setProfile] = useState<ProfileForm>({ name: '', role: '' });
  const [tForm, setTForm] = useState<TargetForm>({ id: '', name: '', requiredHours: '16', editingId: null });

  useEffect(() => {
    if (me) setProfile({ name: me.name, role: me.role || '' });
  }, [me?.id, me?.name, me?.role]);

  const saveProfile = async () => {
    if (!profile.name.trim() || !me) return;
    await db.saveMember({
      id: me.id,
      name: profile.name.trim(),
      role: profile.role.trim(),
      created_at: me.created_at || me.createdAt,
    });
    await reloadMembers();
    toast('Profile saved');
  };

  const saveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tForm.id.trim() || !tForm.name.trim()) return;
    await db.saveTarget({
      id: tForm.id.trim(),
      name: tForm.name.trim(),
      requiredHours: parseInt(tForm.requiredHours, 10) || 0,
    });
    await reloadTargets();
    setTForm({ id: '', name: '', requiredHours: '16', editingId: null });
    toast('Target saved');
  };

  const editTarget = (t: Target) =>
    setTForm({
      id: t.id,
      name: t.name,
      requiredHours: String(t.requiredHours ?? t.required_hours ?? 16),
      editingId: t.id,
    });

  const removeTarget = async (id: string) => {
    if (await confirm({ title: `Delete target ${id}?`, confirmLabel: 'Delete', danger: true })) {
      await db.deleteTarget(id);
      await reloadTargets();
    }
  };

  const exportData = async () => {
    const data = await db.exportAll();
    downloadText('cbs-do-it-backup.json', JSON.stringify(data, null, 2));
    toast('Backup downloaded');
  };

  const clearData = async () => {
    if (
      await confirm({
        title: 'Clear all logged data?',
        message: 'Deletes every accomplishment, WFH log, and objective. Members and IPCR targets are kept. This cannot be undone.',
        confirmLabel: 'Clear data',
        danger: true,
      })
    ) {
      await db.clearAll();
      toast('Logged data cleared');
    }
  };

  return {
    theme,
    setTheme,
    members,
    targets,
    isTauri: db.isTauri(),
    profile,
    setProfile,
    tForm,
    setTForm,
    saveProfile,
    saveTarget,
    editTarget,
    removeTarget,
    exportData,
    clearData,
  };
}
