import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { useConfirm, useToast } from '../components/ui';
import { computeCoverage } from '../lib/coverage';
import { currentCutoffPeriod } from '../lib/periods';
import { TARGET_TO_CATEGORY } from '../lib/constants';
import { todayISO } from '../lib/format';
import * as db from '../lib/db';
import type { Target, Objective, Suggestion, WfhLog, Member } from '../types';

export interface UseThinkerResult {
  activeMember: Member;
  targets: Target[];
  mode: string;
  setMode: React.Dispatch<React.SetStateAction<string>>;
  objectives: Objective[];
  suggestions: Suggestion[];
  thinking: boolean;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  target: string;
  setTarget: React.Dispatch<React.SetStateAction<string>>;
  focus: string[];
  memberName: (id: string) => string;
  grouped: Array<[string, Objective[]]>;
  addObjective: (e: React.FormEvent) => Promise<void>;
  setStatus: (o: Objective, status: string) => Promise<void>;
  removeObjective: (o: Objective) => Promise<void>;
  track: (s: Suggestion) => Promise<void>;
  logSuggestion: (s: Suggestion) => Promise<void>;
  loadSuggestions: () => Promise<void>;
}

export function useThinker(): UseThinkerResult {
  const { activeMember, activeMemberId, members, targets } = useApp();
  const period = useMemo(() => currentCutoffPeriod(), []);
  const confirm = useConfirm();
  const toast = useToast();

  const [mode, setMode] = useState('you');
  const scopeMember = mode === 'you' ? activeMemberId : 'all';

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [wfhItems, setWfhItems] = useState<WfhLog[]>([]);
  const [thinking, setThinking] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const loadObjectives = useCallback(async () => {
    setObjectives(await db.listObjectives({ memberId: scopeMember }));
  }, [scopeMember]);

  const loadSuggestions = useCallback(async () => {
    setThinking(true);
    try {
      setSuggestions(await db.getSuggestions({ memberId: activeMemberId, mode: mode === 'you' ? 'individual' : 'group' }));
    } catch {
      setSuggestions([]);
    } finally {
      setThinking(false);
    }
  }, [activeMemberId, mode]);

  useEffect(() => { void loadObjectives(); }, [loadObjectives]);
  useEffect(() => { void loadSuggestions(); }, [loadSuggestions]);
  useEffect(() => {
    void db.listWfh({ memberId: scopeMember, start: period.startISO, end: period.endISO }).then(setWfhItems);
  }, [scopeMember, period.startISO, period.endISO]);
  useEffect(() => {
    if (!target && targets.length && targets[0]) setTarget(targets[0].id);
  }, [targets, target]);

  const coverage = useMemo(() => computeCoverage(wfhItems, targets), [wfhItems, targets]);
  const focus = coverage.deficits.slice(0, 2).map((d) => d.name);
  const memberName = (id: string) => members.find((m) => m.id === id)?.name || 'Unknown';

  const grouped = useMemo<Array<[string, Objective[]]>>(() => {
    if (mode === 'you') return [[activeMemberId, objectives]];
    const map = new Map<string, Objective[]>();
    objectives.forEach((o) => {
      if (!map.has(o.memberId)) map.set(o.memberId, []);
      map.get(o.memberId)!.push(o);
    });
    return [...map.entries()];
  }, [mode, objectives, activeMemberId]);

  const addObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await db.saveObjective({ memberId: activeMemberId, title: title.trim(), targetCode: target, status: 'open', progress: 0 });
    setTitle('');
    void loadObjectives();
  };

  const setStatus = async (o: Objective, status: string) => {
    const progress = status === 'done' ? 100 : status === 'doing' ? 50 : 0;
    await db.saveObjective({ ...o, status, progress });
    void loadObjectives();
  };

  const removeObjective = async (o: Objective) => {
    if (await confirm({ title: 'Delete this objective?', confirmLabel: 'Delete', danger: true })) {
      await db.deleteObjective(o.id);
      void loadObjectives();
    }
  };

  const track = async (s: Suggestion) => {
    await db.saveObjective({ memberId: activeMemberId, title: s.text, targetCode: s.targetCode, status: 'open', progress: 0 });
    void loadObjectives();
    toast('Added to objectives');
  };

  const logSuggestion = async (s: Suggestion) => {
    await db.addAccomplishment({ memberId: activeMemberId, text: s.text, category: TARGET_TO_CATEGORY[s.targetCode] || 'Other', date: todayISO() });
    toast("Added to today's log");
    void loadSuggestions();
  };

  return {
    activeMember,
    targets,
    mode,
    setMode,
    objectives,
    suggestions,
    thinking,
    title,
    setTitle,
    target,
    setTarget,
    focus,
    memberName,
    grouped,
    addObjective,
    setStatus,
    removeObjective,
    track,
    logSuggestion,
    loadSuggestions,
  };
}
