// Data layer. One async API over two backends:
//   - Tauri + SQLite (packaged app)  -> @tauri-apps/plugin-sql
//   - localStorage (browser dev)      -> JSON in localStorage
//
// The previous build used CommonJS require() for the Tauri modules, which is
// undefined under Vite/ESM, so the DB never loaded and everything silently fell
// back to localStorage. This uses dynamic import() and a real runtime check.

import { DEFAULT_MEMBERS, DEFAULT_TARGETS } from './constants';
import type { Member, Target, Accomplishment, WfhLog, Objective, Settings, Suggestion } from '../types';

interface SqlDatabase {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
}

let sqlDb: SqlDatabase | null = null;
let invokeFn: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let tauri = false;
let ready: Promise<void> | null = null;

const isTauriRuntime = () =>
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

async function init(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (isTauriRuntime()) {
      try {
        const [{ default: Database }, core] = await Promise.all([
          import('@tauri-apps/plugin-sql') as Promise<{ default: { load(path: string): Promise<SqlDatabase> } }>,
          import('@tauri-apps/api/core') as Promise<{ invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }>,
        ]);
        sqlDb = await Database.load('sqlite:accomplishments.db');
        invokeFn = core.invoke;
        tauri = true;
      } catch (e) {
        console.warn('Tauri SQL unavailable, using localStorage.', e);
        tauri = false;
      }
    }
    if (!tauri) seedLocal();
  })();
  return ready;
}

export const isTauri = () => tauri;

/* ----------------------------- localStorage ----------------------------- */

const LS = {
  members: 'acc:members',
  targets: 'acc:targets',
  accomplishments: 'acc:accomplishments',
  wfh: 'acc:wfh',
  objectives: 'acc:objectives',
  settings: 'acc:settings',
} as const;

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
function lsSet<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

function seedLocal() {
  if (!localStorage.getItem(LS.members)) lsSet(LS.members, DEFAULT_MEMBERS);
  if (!localStorage.getItem(LS.targets)) lsSet(LS.targets, DEFAULT_TARGETS);
  if (!localStorage.getItem(LS.accomplishments)) lsSet(LS.accomplishments, []);
  if (!localStorage.getItem(LS.wfh)) lsSet(LS.wfh, []);
  if (!localStorage.getItem(LS.objectives)) lsSet(LS.objectives, []);
}

const inRange = (d: string, start: string, end: string) => d >= start && d <= end;

/* ------------------------------- Members -------------------------------- */

export async function listMembers(): Promise<Member[]> {
  await init();
  if (tauri && sqlDb) {
    return sqlDb.select<Member[]>(
      'SELECT id, name, role, created_at as createdAt FROM members ORDER BY created_at ASC'
    );
  }
  return lsGet<Member[]>(LS.members, DEFAULT_MEMBERS)
    .slice()
    .sort((a, b) => (a.created_at || 0) - (b.created_at || 0))
    .map((m) => ({ ...m, createdAt: m.created_at }));
}

export async function saveMember(m: Partial<Member> & { id: string; name: string }): Promise<Member> {
  await init();
  const row: Member = { id: m.id, name: m.name, role: m.role || '', created_at: m.created_at ?? Date.now() };
  if (tauri && sqlDb) {
    await sqlDb.execute(
      'INSERT INTO members (id, name, role, created_at) VALUES (?, ?, ?, ?) ' +
        'ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role',
      [row.id, row.name, row.role, row.created_at]
    );
    return row;
  }
  const all = lsGet<Member[]>(LS.members, []);
  const next = [...all.filter((x) => x.id !== row.id), row];
  lsSet(LS.members, next);
  return row;
}

export async function deleteMember(id: string): Promise<void> {
  await init();
  if (id === 'me') return; // never remove the default owner
  if (tauri && sqlDb) {
    await sqlDb.execute('DELETE FROM members WHERE id = ?', [id]);
    await sqlDb.execute('DELETE FROM payroll_accomplishments WHERE member_id = ?', [id]);
    await sqlDb.execute('DELETE FROM wfh_logs WHERE member_id = ?', [id]);
    await sqlDb.execute('DELETE FROM objectives WHERE member_id = ?', [id]);
    return;
  }
  lsSet(LS.members, lsGet<Member[]>(LS.members, []).filter((m) => m.id !== id));
  lsSet(LS.accomplishments, lsGet<Accomplishment[]>(LS.accomplishments, []).filter((a) => a.member_id !== id && a.memberId !== id));
  lsSet(LS.wfh, lsGet<WfhLog[]>(LS.wfh, []).filter((w) => w.member_id !== id && w.memberId !== id));
  lsSet(LS.objectives, lsGet<Objective[]>(LS.objectives, []).filter((o) => o.member_id !== id && o.memberId !== id));
}

/* ------------------------------- Targets -------------------------------- */

export async function listTargets(): Promise<Target[]> {
  await init();
  if (tauri && sqlDb) {
    return sqlDb.select<Target[]>(
      'SELECT id, name, required_hours as requiredHours FROM ipcr_targets ORDER BY id ASC'
    );
  }
  return lsGet<Target[]>(LS.targets, DEFAULT_TARGETS).map((t) => ({
    id: t.id,
    name: t.name,
    requiredHours: t.required_hours ?? t.requiredHours,
  }));
}

export async function saveTarget(t: Target): Promise<void> {
  await init();
  const hours = parseInt(String(t.requiredHours ?? t.required_hours), 10) || 8;
  if (tauri && sqlDb) {
    await sqlDb.execute(
      'INSERT OR REPLACE INTO ipcr_targets (id, name, required_hours, color) VALUES (?, ?, ?, ?)',
      [t.id, t.name, hours, '']
    );
    return;
  }
  const all = lsGet<Target[]>(LS.targets, []);
  const next = [...all.filter((x) => x.id !== t.id), { id: t.id, name: t.name, required_hours: hours }];
  lsSet(LS.targets, next);
}

export async function deleteTarget(id: string): Promise<void> {
  await init();
  if (tauri && sqlDb) {
    await sqlDb.execute('DELETE FROM ipcr_targets WHERE id = ?', [id]);
    return;
  }
  lsSet(LS.targets, lsGet<Target[]>(LS.targets, []).filter((t) => t.id !== id));
}

/* -------------------------- Accomplishments ----------------------------- */
// memberId: a specific id, or 'all' for the whole team (group rollups).

export interface ListAccomplishmentsParams {
  memberId?: string;
  start: string;
  end: string;
}

export async function listAccomplishments({ memberId = 'all', start, end }: ListAccomplishmentsParams): Promise<Accomplishment[]> {
  await init();
  if (tauri && sqlDb) {
    const where = ['date BETWEEN ? AND ?'];
    const args: unknown[] = [start, end];
    if (memberId !== 'all') { where.push('member_id = ?'); args.push(memberId); }
    return sqlDb.select<Accomplishment[]>(
      `SELECT id, member_id as memberId, text, category, date, created_at as createdAt
       FROM payroll_accomplishments WHERE ${where.join(' AND ')}
       ORDER BY date DESC, created_at DESC`,
      args
    );
  }
  return lsGet<Accomplishment[]>(LS.accomplishments, [])
    .filter((a) => inRange(a.date, start, end) && (memberId === 'all' || a.member_id === memberId || a.memberId === memberId))
    .map((a) => ({ ...a, memberId: a.member_id || a.memberId, createdAt: a.created_at || a.createdAt }))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || b.createdAt || 0) - (a.created_at || a.createdAt || 0));
}

export async function addAccomplishment(a: Partial<Accomplishment> & { memberId: string; text: string; category: string; date: string }): Promise<Accomplishment> {
  await init();
  const row = {
    id: a.id || crypto.randomUUID(),
    member_id: a.memberId,
    text: a.text,
    category: a.category,
    date: a.date,
    created_at: a.createdAt ?? a.created_at ?? Date.now(),
  };
  if (tauri && sqlDb) {
    await sqlDb.execute(
      'INSERT INTO payroll_accomplishments (id, member_id, text, category, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [row.id, row.member_id, row.text, row.category, row.date, row.created_at]
    );
  } else {
    lsSet(LS.accomplishments, [row, ...lsGet<Accomplishment[]>(LS.accomplishments, [])]);
  }
  return { ...row, memberId: row.member_id, createdAt: row.created_at };
}

export async function deleteAccomplishment(id: string): Promise<void> {
  await init();
  if (tauri && sqlDb) { await sqlDb.execute('DELETE FROM payroll_accomplishments WHERE id = ?', [id]); return; }
  lsSet(LS.accomplishments, lsGet<Accomplishment[]>(LS.accomplishments, []).filter((a) => a.id !== id));
}

/* ------------------------------- WFH logs ------------------------------- */

export interface ListWfhParams {
  memberId?: string;
  start: string;
  end: string;
}

export async function listWfh({ memberId = 'all', start, end }: ListWfhParams): Promise<WfhLog[]> {
  await init();
  if (tauri && sqlDb) {
    const where = ['date BETWEEN ? AND ?'];
    const args: unknown[] = [start, end];
    if (memberId !== 'all') { where.push('member_id = ?'); args.push(memberId); }
    return sqlDb.select<WfhLog[]>(
      `SELECT id, member_id as memberId, output, hours, target_code as targetCode, date, created_at as createdAt
       FROM wfh_logs WHERE ${where.join(' AND ')}
       ORDER BY date DESC, created_at DESC`,
      args
    );
  }
  return lsGet<WfhLog[]>(LS.wfh, [])
    .filter((w) => inRange(w.date, start, end) && (memberId === 'all' || w.member_id === memberId || w.memberId === memberId))
    .map((w) => ({ ...w, memberId: w.member_id || w.memberId, targetCode: w.target_code || w.targetCode, createdAt: w.created_at || w.createdAt }))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || b.createdAt || 0) - (a.created_at || a.createdAt || 0));
}

export async function addWfh(w: Partial<WfhLog> & { memberId: string; output: string; hours: string | number; targetCode: string; date: string }): Promise<WfhLog> {
  await init();
  const row = {
    id: w.id || crypto.randomUUID(),
    member_id: w.memberId,
    output: w.output,
    hours: String(w.hours),
    target_code: w.targetCode,
    date: w.date,
    created_at: w.createdAt ?? w.created_at ?? Date.now(),
  };
  if (tauri && sqlDb) {
    await sqlDb.execute(
      'INSERT INTO wfh_logs (id, member_id, output, hours, target_code, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.member_id, row.output, row.hours, row.target_code, row.date, row.created_at]
    );
  } else {
    lsSet(LS.wfh, [row, ...lsGet<WfhLog[]>(LS.wfh, [])]);
  }
  return { ...row, memberId: row.member_id, targetCode: row.target_code, createdAt: row.created_at };
}

export async function deleteWfh(id: string): Promise<void> {
  await init();
  if (tauri && sqlDb) { await sqlDb.execute('DELETE FROM wfh_logs WHERE id = ?', [id]); return; }
  lsSet(LS.wfh, lsGet<WfhLog[]>(LS.wfh, []).filter((w) => w.id !== id));
}

/* ------------------------------ Objectives ------------------------------ */

export interface ListObjectivesParams {
  memberId?: string;
}

export async function listObjectives({ memberId = 'all' }: ListObjectivesParams = {}): Promise<Objective[]> {
  await init();
  if (tauri && sqlDb) {
    const where = memberId !== 'all' ? 'WHERE member_id = ?' : '';
    const args = memberId !== 'all' ? [memberId] : [];
    return sqlDb.select<Objective[]>(
      `SELECT id, member_id as memberId, title, target_code as targetCode, status, progress, created_at as createdAt
       FROM objectives ${where} ORDER BY created_at DESC`,
      args
    );
  }
  return lsGet<Objective[]>(LS.objectives, [])
    .filter((o) => memberId === 'all' || o.member_id === memberId || o.memberId === memberId)
    .map((o) => ({ ...o, memberId: o.member_id || o.memberId, targetCode: o.target_code || o.targetCode, createdAt: o.created_at || o.createdAt }))
    .sort((a, b) => (b.created_at || b.createdAt || 0) - (a.created_at || a.createdAt || 0));
}

export async function saveObjective(o: Partial<Objective> & { memberId: string; title: string }): Promise<Objective> {
  await init();
  const row = {
    id: o.id || crypto.randomUUID(),
    member_id: o.memberId,
    title: o.title,
    target_code: o.targetCode || '',
    status: o.status || 'open',
    progress: o.progress ?? 0,
    created_at: o.createdAt ?? o.created_at ?? Date.now(),
  };
  if (tauri && sqlDb) {
    await sqlDb.execute(
      'INSERT INTO objectives (id, member_id, title, target_code, status, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ' +
        'ON CONFLICT(id) DO UPDATE SET title=excluded.title, target_code=excluded.target_code, status=excluded.status, progress=excluded.progress',
      [row.id, row.member_id, row.title, row.target_code, row.status, row.progress, row.created_at]
    );
  } else {
    const all = lsGet<Objective[]>(LS.objectives, []);
    lsSet(LS.objectives, [row, ...all.filter((x) => x.id !== row.id)]);
  }
  return { ...row, memberId: row.member_id, targetCode: row.target_code, createdAt: row.created_at };
}

export async function deleteObjective(id: string): Promise<void> {
  await init();
  if (tauri && sqlDb) { await sqlDb.execute('DELETE FROM objectives WHERE id = ?', [id]); return; }
  lsSet(LS.objectives, lsGet<Objective[]>(LS.objectives, []).filter((o) => o.id !== id));
}

/* ------------------------------- Settings ------------------------------- */

export function getSettings(): Settings {
  return lsGet<Settings>(LS.settings, { theme: 'light' });
}
export function saveSettings(s: Partial<Settings>): void {
  lsSet(LS.settings, { ...getSettings(), ...s });
}

/* -------------------------- Thinker suggestions ------------------------- */
// Tauri: run the Python ML sidecar via the Rust command.
// Browser dev: deterministic deficit-based fallback in JS.

export interface GetSuggestionsParams {
  memberId?: string;
  mode?: 'individual' | 'group';
}

export async function getSuggestions({ memberId = 'me', mode = 'individual' }: GetSuggestionsParams = {}): Promise<Suggestion[]> {
  await init();
  if (tauri && invokeFn) {
    try {
      const raw = await invokeFn('get_ml_suggestions', { memberId, mode }) as string;
      const parsed = JSON.parse(raw) as Array<{ id?: string; text: string; targetCode: string }>;
      return parsed.map((s, i) => ({ id: s.id ?? `s-${i}`, text: s.text, targetCode: s.targetCode }));
    } catch (e) {
      console.warn('ML sidecar failed, using local suggestions.', e);
    }
  }
  return localSuggest({ memberId, mode });
}

const SEED_TASKS = [
  { text: 'Run R quality-check scripts on the latest CBMS dataset', targetCode: 'IPCR-A-102' },
  { text: 'Standardize component tokens across the CBMS Portal', targetCode: 'IPCR-B-004' },
  { text: 'Draft the cutoff output summary for verification', targetCode: 'IPCR-A-101' },
  { text: 'Resolve the Vue 3 router hydration mismatch in CBMS', targetCode: 'IPCR-B-004' },
  { text: 'Refactor the Excel VBA verification macros for CBMS 2026', targetCode: 'IPCR-B-004' },
  { text: 'Document the CBMS Portal API endpoints', targetCode: 'IPCR-A-101' },
  { text: 'Process weekly CBMS data updates and clean outputs', targetCode: 'IPCR-A-102' },
  { text: 'Run the technical evidence review for the compliance audit', targetCode: 'IPCR-ADMIN' },
];

async function localSuggest({ memberId, mode }: { memberId: string; mode: 'individual' | 'group' }): Promise<Suggestion[]> {
  // Count logged work per target over a wide window so deficits surface.
  const start = '2000-01-01';
  const end = '2999-12-31';
  const wfh = await listWfh({ memberId: mode === 'group' ? 'all' : memberId, start, end });
  const counts: Record<string, number> = {};
  wfh.forEach((w) => { counts[w.targetCode] = (counts[w.targetCode] || 0) + 1; });
  const targets = await listTargets();
  targets.forEach((t) => { if (!(t.id in counts)) counts[t.id] = 0; });

  const deficitOrder = Object.entries(counts).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  const deficitSet = new Set(deficitOrder.slice(0, 2));
  const ranked = SEED_TASKS
    .map((t) => ({ ...t, score: deficitSet.has(t.targetCode) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, 4).map((t, i) => ({ id: `s-${i}`, text: t.text, targetCode: t.targetCode }));
}

/* ------------------------------ Data export ----------------------------- */

export interface ExportedData {
  exportedAt: string;
  members: Member[];
  targets: Target[];
  accomplishments: Accomplishment[];
  wfh: WfhLog[];
  objectives: Objective[];
}

export async function exportAll(): Promise<ExportedData> {
  await init();
  const wide = { memberId: 'all', start: '2000-01-01', end: '2999-12-31' };
  const [m, t, acc, wfh, objectives] = await Promise.all([
    listMembers(),
    listTargets(),
    listAccomplishments(wide),
    listWfh(wide),
    listObjectives({ memberId: 'all' }),
  ]);
  return { exportedAt: new Date().toISOString(), members: m, targets: t, accomplishments: acc, wfh, objectives };
}

// Clears logged data (accomplishments, WFH, objectives). Keeps members + targets.
export async function clearAll(): Promise<void> {
  await init();
  if (tauri && sqlDb) {
    await sqlDb.execute('DELETE FROM payroll_accomplishments');
    await sqlDb.execute('DELETE FROM wfh_logs');
    await sqlDb.execute('DELETE FROM objectives');
    return;
  }
  lsSet(LS.accomplishments, []);
  lsSet(LS.wfh, []);
  lsSet(LS.objectives, []);
}

export { init };
