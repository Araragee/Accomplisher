import { fmtDate } from './format';

// Build a clean Markdown report from logged entries. Grouped by date, newest
// first. Works offline, no API calls.
export function buildReport({ kind, memberName, periodLabel, items }) {
  const heading = kind === 'wfh' ? 'WFH Accomplishment Report' : 'Accomplishment Report';
  const head = `# ${heading}\n\n${memberName}  \n${periodLabel}\n`;

  if (items.length === 0) return `${head}\n_No entries logged for this period._\n`;

  const byDate = new Map();
  items.forEach((e) => {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  });

  const sections = [...byDate.keys()]
    .sort((a, b) => b.localeCompare(a))
    .map((date) => {
      const rows = byDate.get(date).map((e) => {
        if (kind === 'wfh') return `- ${e.output} (${e.hours} hrs, ${e.targetCode})`;
        return `- [${e.category}] ${e.text}`;
      });
      return `## ${fmtDate(date)}\n${rows.join('\n')}`;
    });

  return `${head}\n${sections.join('\n\n')}\n`;
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
