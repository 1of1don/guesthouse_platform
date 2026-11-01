import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Pause, X } from 'lucide-react';
import LoadingButton from './LoadingButton';

interface ConfirmModalProps {
  open: boolean;
  title: string;                       // e.g. "Suspend guesthouse?"
  message: ReactNode;
  confirmLabel: string;                // e.g. "Suspend"
  loadingLabel?: string;               // e.g. "Suspending..."
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'accent' | 'danger';
  icon?: ReactNode;                    // defaults to a pause icon
  loading?: boolean;                   // true = confirm button spins, cancel is disabled
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  loadingLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'accent',
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();

  // Press Escape to close (not while an action is running)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  // Rendered into document.body so the dimmed backdrop always covers the whole page
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-[#E8D8C3] dark:border-[#382B22] bg-white dark:bg-[#1D1714] p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#8F7F70] hover:text-[#231A14] dark:hover:text-[#F7F4EF] disabled:opacity-40 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-[#F3EDE4] dark:bg-[#281F19] text-[#9E7246] dark:text-[#D6A670] flex items-center justify-center">
          {icon ?? <Pause className="w-5 h-5" />}
        </div>

        <h2 id={titleId} className="mt-4 text-base font-bold text-[#231A14] dark:text-[#F7F4EF]">
          {title}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-[#7A695C] dark:text-[#A8988B]">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <LoadingButton variant="secondary" onClick={onCancel} disabled={loading} autoFocus>
            {cancelLabel}
          </LoadingButton>
          <LoadingButton
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            loadingText={loadingLabel}
          >
            {confirmLabel}
          </LoadingButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
