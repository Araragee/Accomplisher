import { useCallback, useEffect, useState } from 'react';
import * as db from '../lib/db';

export function useAccomplishments({ memberId, period }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await db.listAccomplishments({ memberId, start: period.startISO, end: period.endISO });
    setItems(rows);
    setLoading(false);
  }, [memberId, period.startISO, period.endISO]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (data) => {
      const row = await db.addAccomplishment({ ...data, memberId });
      await reload();
      return row;
    },
    [memberId, reload]
  );

  const remove = useCallback(
    async (id) => {
      await db.deleteAccomplishment(id);
      await reload();
    },
    [reload]
  );

  return { items, loading, reload, add, remove };
}

export function useWfh({ memberId, period }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await db.listWfh({ memberId, start: period.startISO, end: period.endISO });
    setItems(rows);
    setLoading(false);
  }, [memberId, period.startISO, period.endISO]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (data) => {
      const row = await db.addWfh({ ...data, memberId });
      await reload();
      return row;
    },
    [memberId, reload]
  );

  const remove = useCallback(
    async (id) => {
      await db.deleteWfh(id);
      await reload();
    },
    [reload]
  );

  return { items, loading, reload, add, remove };
}
