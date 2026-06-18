import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  children?: ReactNode;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, footer, size = 'md', children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'w-full rounded-xl border border-line bg-surface shadow-lg overflow-hidden',
          'max-h-[90vh] flex flex-col',
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div className="px-5 py-4 border-b border-line-subtle flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-md p-1 text-ink-400 hover:bg-hover hover:text-ink-900 transition-colors"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-line-subtle bg-surface-2 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
