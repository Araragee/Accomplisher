/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ToastOptions {
  tone?: 'success' | 'info' | 'warn';
  duration?: number;
}

export type ToastFunction = (message: string, opts?: ToastOptions) => void;

const ToastContext = createContext<ToastFunction | null>(null);

const icons = { success: Check, info: Info, warn: AlertTriangle } as const;
const accents = {
  success: 'text-sage',
  info: 'text-info',
  warn: 'text-[color-mix(in_oklab,var(--warn)_72%,var(--ink))]',
} as const;

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warn';
}

export interface ToastProviderProps {
  children: React.ReactNode;
}


export function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const idRef = useRef(0);

  const toast = useCallback<ToastFunction>((message, { tone = 'success', duration = 2600 } = {}) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = icons[t.tone] || Info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-line bg-raised px-3.5 py-2.5 text-sm text-ink shadow-soft [animation:toastIn_200ms_ease-out]"
            >
              <Icon className={cn('size-4 shrink-0', accents[t.tone])} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFunction {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}
