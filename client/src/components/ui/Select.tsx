import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: ReactNode;
  error?: string | boolean;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, error, options, placeholder, containerClassName, className, id, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hasError = Boolean(error);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-semibold text-ink-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={hasError || undefined}
          className={cn(
            'w-full appearance-none rounded-lg border bg-surface text-ink-900 text-sm px-3 py-2.5 pr-10',
            'outline-none cursor-pointer transition-[border-color,box-shadow]',
            'focus:border-brand focus:ring-[3px] focus:ring-focus',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError ? 'border-brand' : 'border-line-strong',
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </div>
      {typeof error === 'string' ? (
        <div className="mt-2 text-xs text-brand">{error}</div>
      ) : helperText ? (
        <div className="mt-2 text-xs text-ink-400">{helperText}</div>
      ) : null}
    </div>
  );
});
