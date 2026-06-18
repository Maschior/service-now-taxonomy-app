import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeVariant = 'info' | 'success' | 'warn' | 'danger' | 'neutral' | 'brand';
export type BadgeShape = 'pill' | 'priority';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  shape?: BadgeShape;
  withDot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  info: 'bg-info-bg text-info-fg border-info-border',
  success: 'bg-success-bg text-success-fg border-success-border',
  warn: 'bg-warn-bg text-warn-fg border-warn-border',
  danger: 'bg-danger-bg text-danger-fg border-danger-border',
  neutral: 'bg-neutral-bg text-neutral-fg border-neutral-border',
  brand: 'bg-brand text-on-brand border-transparent',
};

export function Badge({
  variant = 'neutral',
  shape = 'pill',
  withDot,
  className,
  children,
  ...rest
}: BadgeProps) {
  const showDot = withDot ?? shape === 'pill';
  const isPill = shape === 'pill';

  return (
    <span
      className={cn(
        'inline-flex items-center border font-semibold',
        isPill ? 'gap-1.5 rounded-full px-2.5 py-1 text-xs' : 'rounded-md px-2 py-1 text-xs font-bold font-mono',
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {showDot && <span className="h-[7px] w-[7px] rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
