import { useCallback, useEffect, useState } from 'react';
import * as db from '../lib/db';
import type { AccomplishmentPatch, WfhPatch } from '../lib/db';
import type { Period } from '../lib/periods';
import type { Accomplishment, WfhLog } from '../types';

export interface UseEntriesParams {
  memberId: string;
  period: Period;
}

// Every mutation follows the same beat: run it, reload this list, then tell other
// mounted lists (e.g. the sidebar) to refresh via the `entries-changed` event.
function useEntrySync(reload: () => Promise<void>) {
  return useCallback(
    async <T>(run: () => Promise<T>): Promise<T> => {
      const result = await run();
      await reload();
      window.dispatchEvent(new CustomEvent('entries-changed'));
      return result;
    },
    [reload]
  );
}

export interface UseAccomplishmentsResult {
  items: Accomplishment[];
  loading: boolean;
  reload: () => Promise<void>;
  add: (data: AccomplishmentPatch & { id?: string }) => Promise<Accomplishment>;
  update: (id: string, data: AccomplishmentPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useAccomplishments({ memberId, period }: UseEntriesParams): UseAccomplishmentsResult {
  const [items, setItems] = useState<Accomplishment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setItems(await db.listAccomplishments({ memberId, start: period.startISO, end: period.endISO }));
    setLoading(false);
  }, [memberId, period.startISO, period.endISO]);

  const sync = useEntrySync(reload);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const handler = () => { void reload(); };
    window.addEventListener('entries-changed', handler);
    return () => window.removeEventListener('entries-changed', handler);
  }, [reload]);

  const add = useCallback(
    (data: AccomplishmentPatch & { id?: string }) => sync(() => db.addAccomplishment({ ...data, memberId })),
    [sync, memberId]
  );
  const update = useCallback((id: string, data: AccomplishmentPatch) => sync(() => db.updateAccomplishment(id, data)), [sync]);
  const remove = useCallback((id: string) => sync(() => db.deleteAccomplishment(id)), [sync]);

  return { items, loading, reload, add, update, remove };
}

export interface UseWfhResult {
  items: WfhLog[];
  loading: boolean;
  reload: () => Promise<void>;
  add: (data: WfhPatch & { id?: string }) => Promise<WfhLog>;
  update: (id: string, data: WfhPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useWfh({ memberId, period }: UseEntriesParams): UseWfhResult {
  const [items, setItems] = useState<WfhLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setItems(await db.listWfh({ memberId, start: period.startISO, end: period.endISO }));
    setLoading(false);
  }, [memberId, period.startISO, period.endISO]);

  const sync = useEntrySync(reload);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const handler = () => { void reload(); };
    window.addEventListener('entries-changed', handler);
    return () => window.removeEventListener('entries-changed', handler);
  }, [reload]);

  const add = useCallback(
    (data: WfhPatch & { id?: string }) => sync(() => db.addWfh({ ...data, memberId })),
    [sync, memberId]
  );
  const update = useCallback((id: string, data: WfhPatch) => sync(() => db.updateWfh(id, data)), [sync]);
  const remove = useCallback((id: string) => sync(() => db.deleteWfh(id)), [sync]);

  return { items, loading, reload, add, update, remove };
}
