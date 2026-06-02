import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const fieldBase =
  'w-full bg-surface text-ink placeholder:text-faint border border-line rounded-lg text-sm transition-colors duration-150 focus-ring focus-visible:border-line-strong disabled:opacity-50';

export function Input({ className, ...props }) {
  return <input className={cn(fieldBase, 'h-10 px-3', className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea rows={rows} className={cn(fieldBase, 'px-3 py-2.5 resize-none leading-relaxed', className)} {...props} />;
}

// Themed select built on Headless UI Listbox. options: [{ value, label }].
export function Select({ value, onChange, options = [], placeholder = 'Select', disabled, className, 'aria-label': ariaLabel }) {
  const current = options.find((o) => o.value === value);
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        aria-label={ariaLabel}
        className={cn(fieldBase, 'flex h-10 items-center justify-between gap-2 pl-3 pr-2.5 text-left', className)}
      >
        <span className={cn('truncate', current ? 'text-ink' : 'text-faint')}>{current ? current.label : placeholder}</span>
        <ChevronDown className="size-4 shrink-0 text-subtle" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        transition
        className="z-50 max-h-64 w-[var(--button-width)] min-w-36 origin-top overflow-auto rounded-lg border border-line bg-raised p-1 shadow-soft transition duration-150 ease-out [--anchor-gap:0.25rem] data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {options.map((o) => (
          <ListboxOption
            key={o.value}
            value={o.value}
            className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm text-ink data-[focus]:bg-panel"
          >
            <span className="truncate">{o.label}</span>
            <Check className="size-4 shrink-0 text-accent opacity-0 group-data-[selected]:opacity-100" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

export function Label({ children, className, ...props }) {
  return (
    <label className={cn('block text-xs font-medium text-subtle', className)} {...props}>
      {children}
    </label>
  );
}

export function Field({ label, hint, htmlFor, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}
