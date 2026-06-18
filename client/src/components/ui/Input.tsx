import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: ReactNode;
  error?: string | boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, leftIcon, rightIcon, containerClassName, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hasError = Boolean(error);
  const errorText = typeof error === 'string' ? error : null;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError || undefined}
          className={cn(
            'w-full rounded-lg border bg-surface text-ink-900 text-sm px-3 py-2.5',
            'placeholder:text-ink-400 outline-none transition-[border-color,box-shadow]',
            'focus:border-brand focus:ring-[3px] focus:ring-focus',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError ? 'border-brand' : 'border-line-strong',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{rightIcon}</span>
        )}
      </div>
      {errorText ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand">
          <AlertCircle size={14} strokeWidth={2} aria-hidden />
          {errorText}
        </div>
      ) : helperText ? (
        <div className="mt-2 text-xs text-ink-400">{helperText}</div>
      ) : null}
    </div>
  );
});
