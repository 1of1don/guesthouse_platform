import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;          // defaults to 'success'
  actionLabel?: string;      // e.g. "Undo" or "Retry"
  onAction?: () => void;
  duration?: number;         // milliseconds, defaults to 5000
}

interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastType, { border: string; icon: string }> = {
  success: { border: 'border-emerald-200 dark:border-emerald-900/60', icon: 'text-emerald-600 dark:text-emerald-400' },
  error: { border: 'border-rose-200 dark:border-rose-900/60', icon: 'text-rose-600 dark:text-rose-400' },
  info: { border: 'border-[#E8D8C3] dark:border-[#382B22]', icon: 'text-[#9E7246] dark:text-[#D6A670]' },
};

function ToastIcon({ type }: { type: ToastType }) {
  const cls = `w-4 h-4 shrink-0 mt-0.5 ${styles[type].icon}`;
  if (type === 'success') return <CheckCircle2 className={cls} />;
  if (type === 'error') return <AlertCircle className={cls} />;
  return <Info className={cls} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      const item: ToastItem = { ...options, id, type: options.type ?? 'success' };
      setToasts((prev) => [...prev.slice(-2), item]); // keep at most 3 on screen
      window.setTimeout(() => dismiss(id), options.duration ?? 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[70] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white dark:bg-[#1E1814] px-4 py-3 shadow-lg text-xs text-[#231A14] dark:text-[#F7F4EF] ${styles[t.type].border}`}
          >
            <ToastIcon type={t.type} />
            <p className="flex-1 font-medium leading-relaxed">{t.message}</p>
            {t.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="font-semibold underline text-[#845A32] dark:text-[#D6A670] cursor-pointer"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-[#8F7F70] hover:text-[#231A14] dark:hover:text-[#F7F4EF] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
