import { useCallback, useEffect, useState } from 'react';
import * as db from '../lib/db';
import type { Period } from '../lib/periods';
import type { Accomplishment, WfhLog } from '../types';

export interface UseEntriesParams {
  memberId: string;
  period: Period;
}

export interface UseAccomplishmentsResult {
  items: Accomplishment[];
  loading: boolean;
  reload: () => Promise<void>;
  add: (data: { text: string; category: string; date: string; id?: string }) => Promise<Accomplishment>;
  remove: (id: string) => Promise<void>;
}

export function useAccomplishments({ memberId, period }: UseEntriesParams): UseAccomplishmentsResult {
  const [items, setItems] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await db.listAccomplishments({ memberId, start: period.startISO, end: period.endISO });
    setItems(rows);
    setLoading(false);
  }, [memberId, period.startISO, period.endISO]);


  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  useEffect(() => {
    const handler = () => { void

    reload(); };
    window.addEventListener('entries-changed', handler);
    return () => window.removeEventListener('entries-changed', handler);
  }, [reload]);

  const add = useCallback(
    async (data: { text: string; category: string; date: string; id?: string }) => {
      const row = await db.addAccomplishment({ ...data, memberId });
      await

    reload();
      window.dispatchEvent(new CustomEvent('entries-changed'));
      return row;
    },
    [memberId, reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await db.deleteAccomplishment(id);
      await

    reload();
      window.dispatchEvent(new CustomEvent('entries-changed'));
    },
    [reload]
  );

  return { items, loading, reload, add, remove };
}

export interface UseWfhResult {
  items: WfhLog[];
  loading: boolean;
  reload: () => Promise<void>;
  add: (data: { output: string; hours: string | number; targetCode: string; date: string; id?: string }) => Promise<WfhLog>;
  remove: (id: string) => Promise<void>;
}

export function useWfh({ memberId, period }: UseEntriesParams): UseWfhResult {
  const [items, setItems] = useState<WfhLog[]>([]);
  const [loading, setLoading] = useState(true);


  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await db.listWfh({ memberId, start: period.startISO, end: period.endISO });
    setItems(rows);
    setLoading(false);
  }, [memberId, period.startISO, period.endISO]);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  useEffect(() => {
    const handler = () => { void

    reload(); };
    window.addEventListener('entries-changed', handler);
    return () => window.removeEventListener('entries-changed', handler);
  }, [reload]);

  const add = useCallback(
    async (data: { output: string; hours: string | number; targetCode: string; date: string; id?: string }) => {
      const row = await db.addWfh({ ...data, memberId });
      await

    reload();
      window.dispatchEvent(new CustomEvent('entries-changed'));
      return row;
    },
    [memberId, reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await db.deleteWfh(id);
      await

    reload();
      window.dispatchEvent(new CustomEvent('entries-changed'));
    },
    [reload]
  );

  return { items, loading, reload, add, remove };
}
