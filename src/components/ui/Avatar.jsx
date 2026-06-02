import { initials, memberTone, avatarToneClass } from '../../lib/avatar';
import { cn } from '../../lib/cn';

const sizes = {
  sm: 'size-7 text-[0.6875rem]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
};

export function Avatar({ name, id, size = 'md', className }) {
  const tone = memberTone(id || name);
  return (
    <span className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold', sizes[size], avatarToneClass[tone], className)}>
      {initials(name)}
    </span>
  );
}
