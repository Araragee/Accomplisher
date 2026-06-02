export interface Category {
  id: string;
  label: string;
  tone: 'sage' | 'info' | 'warn' | 'danger' | 'accent' | 'neutral';
}

// Accomplishment categories. `tone` maps to a Badge color role (see ui/Badge).
export const CATEGORIES: Category[] = [
  { id: 'Dev', label: 'Development', tone: 'sage' },
  { id: 'Data', label: 'Data', tone: 'info' },
  { id: 'Docs', label: 'Documentation', tone: 'warn' },
  { id: 'Bugfix', label: 'Bugfix', tone: 'danger' },
  { id: 'Meeting', label: 'Meeting', tone: 'accent' },
  { id: 'Other', label: 'Other', tone: 'neutral' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const categoryMeta = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]!;

// Maps an IPCR target code to a default category when adding a suggestion.
export const TARGET_TO_CATEGORY: Record<string, string> = {
  'IPCR-B-004': 'Dev',
  'IPCR-A-102': 'Data',
  'IPCR-A-101': 'Docs',
  'IPCR-ADMIN': 'Meeting',
};

// Seed data, mirrored by the SQLite migration so localStorage dev matches the
// packaged app.
export const DEFAULT_TARGETS = [
  { id: 'IPCR-B-004', name: 'System Development & Vue 3', required_hours: 40 },
  { id: 'IPCR-A-102', name: 'Data Processing & R Scripting', required_hours: 32 },
  { id: 'IPCR-A-101', name: 'Technical Documentation', required_hours: 16 },
  { id: 'IPCR-ADMIN', name: 'Administrative & Support', required_hours: 16 },
];

export const DEFAULT_MEMBERS = [
  { id: 'me', name: 'Dave', role: 'Front-end Developer', created_at: 0 },
];

export const WFH_HOURS_OPTIONS = ['8.0', '6.0', '4.0', '2.0', '1.0'];

export const OBJECTIVE_STATUS = [
  { id: 'open', label: 'To do' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
];
