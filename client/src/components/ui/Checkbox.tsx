import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const input = (
    <input
      ref={ref}
      id={inputId}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-line-strong text-brand cursor-pointer',
        'accent-[var(--brand)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus',
        className
      )}
      {...rest}
    />
  );

  if (!label) return input;

  return (
    <label htmlFor={inputId} className="inline-flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
      {input}
      {label}
    </label>
  );
});
