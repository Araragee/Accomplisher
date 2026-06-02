import React from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof widths;
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps): React.JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-ink/30 transition duration-150 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={cn(
            'relative w-full rounded-2xl border border-line bg-raised p-6 shadow-soft transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
            widths[size]
          )}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-md p-1 text-faint hover:bg-panel hover:text-ink focus-ring"
          >
            <X className="size-4" />
          </button>
          {title && <DialogTitle className="pr-8 text-lg font-semibold text-ink">{title}</DialogTitle>}
          {description && <Description className="mt-1 text-sm text-muted">{description}</Description>}
          <div className={cn(title || description ? 'mt-5' : '')}>{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
