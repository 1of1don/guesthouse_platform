import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';

type Variant = 'primary' | 'accent' | 'secondary' | 'danger';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;       // true = show the spinner and block clicks
  loadingText?: string;    // e.g. "Adding...", "Suspending...", "Saving..."
  variant?: Variant;
  icon?: ReactNode;        // optional icon shown before the label when not loading
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#231A14] hover:bg-[#372A22] text-white dark:bg-[#EAE2D8] dark:text-[#181310] dark:hover:bg-white',
  accent: 'bg-[#9E7246] hover:bg-[#845A32] text-white',
  secondary:
    'bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1] text-[#231A14] dark:text-[#EAE2D8]',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
};

// Remember: pass type="submit" when this button submits a form.
export default function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  icon,
  disabled,
  children,
  className = '',
  type = 'button',
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
