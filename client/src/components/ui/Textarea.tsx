import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: ReactNode;
  error?: string | boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helperText, error, containerClassName, className, id, ...rest },
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
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={hasError || undefined}
        className={cn(
          'w-full rounded-lg border bg-surface text-ink-900 text-sm px-3 py-2.5 leading-relaxed',
          'placeholder:text-ink-400 outline-none resize-y transition-[border-color,box-shadow]',
          'focus:border-brand focus:ring-[3px] focus:ring-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError ? 'border-brand' : 'border-line-strong',
          className
        )}
        {...rest}
      />
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
