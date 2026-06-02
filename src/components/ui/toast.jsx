import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';

const ToastContext = createContext(null);

const icons = { success: Check, info: Info, warn: AlertTriangle };
const accents = {
  success: 'text-sage',
  info: 'text-info',
  warn: 'text-[color-mix(in_oklab,var(--warn)_72%,var(--ink))]',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, { tone = 'success', duration = 2600 } = {}) => {
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

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}
