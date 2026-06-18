import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover',
  secondary: 'bg-surface text-ink-900 border border-line-strong hover:bg-hover',
  ghost: 'bg-transparent text-brand hover:bg-brand-tint',
  danger: 'bg-[var(--danger-fg)] text-white hover:opacity-90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[13px] px-3 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-[18px] py-2.5 rounded-lg gap-2',
  lg: 'text-[15px] px-6 py-[13px] rounded-[9px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={16} strokeWidth={2} aria-hidden />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
