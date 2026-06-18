import type { ReactNode } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from './cn';

export type AlertVariant = 'info' | 'success' | 'warn' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-info-bg border-info-border text-info-fg',
  success: 'bg-success-bg border-success-border text-success-fg',
  warn: 'bg-warn-bg border-warn-border text-warn-fg',
  danger: 'bg-danger-bg border-danger-border text-danger-fg',
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  info: <Info size={20} strokeWidth={1.7} aria-hidden />,
  success: <CheckCircle2 size={20} strokeWidth={1.7} aria-hidden />,
  warn: <AlertTriangle size={20} strokeWidth={1.7} aria-hidden />,
  danger: <AlertCircle size={20} strokeWidth={1.7} aria-hidden />,
};

export function Alert({ variant = 'info', title, icon, onClose, className, children }: AlertProps) {
  return (
    <div role="alert" className={cn('flex gap-3 rounded-[10px] border p-4', variantClasses[variant], className)}>
      <span className="flex-none mt-0.5">{icon ?? defaultIcons[variant]}</span>
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        {children && <div className={cn('text-[13px] leading-relaxed opacity-90', title && 'mt-0.5')}>{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex-none rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
