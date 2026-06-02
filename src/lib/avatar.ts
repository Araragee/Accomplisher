const TONES = ['accent', 'sage', 'info', 'warn'] as const;
export type AvatarTone = typeof TONES[number];

export function memberTone(id: string = ''): AvatarTone {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length]!;
}

export function initials(name: string = ''): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export const avatarToneClass: Record<AvatarTone, string> = {
  accent: 'bg-accent-soft text-accent',
  sage: 'bg-sage-soft text-sage',
  info: 'bg-[color-mix(in_oklab,var(--info)_15%,var(--surface))] text-[color-mix(in_oklab,var(--info)_78%,var(--ink))]',
  warn: 'bg-warn-soft text-[color-mix(in_oklab,var(--warn)_72%,var(--ink))]',
};
