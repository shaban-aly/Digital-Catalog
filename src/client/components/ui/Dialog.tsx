import * as React from 'react';
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'info' | 'success';

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: DialogVariant;
}

export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
}

interface DialogContextValue {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogInternalState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: DialogVariant;
  resolve: ((value: boolean) => void) | null;
}

const defaultState: DialogInternalState = {
  isOpen: false,
  type: 'alert',
  title: '',
  message: '',
  confirmText: 'حسناً',
  cancelText: 'إلغاء',
  variant: 'info',
  resolve: null,
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogInternalState>(defaultState);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogContainerRef = useRef<HTMLDivElement>(null);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts: AlertOptions =
        typeof options === 'string'
          ? { message: options, title: 'تنبيه', variant: 'info' }
          : options;

      setDialog({
        isOpen: true,
        type: 'alert',
        title: opts.title || (opts.variant === 'danger' ? 'خطأ' : opts.variant === 'success' ? 'تم بنجاح' : 'تنبيه'),
        message: opts.message,
        confirmText: opts.confirmText || 'حسناً',
        cancelText: '',
        variant: opts.variant || 'info',
        resolve: () => resolve(),
      });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmOptions =
        typeof options === 'string'
          ? { message: options, title: 'تأكيد العملية', variant: 'warning' }
          : options;

      setDialog({
        isOpen: true,
        type: 'confirm',
        title: opts.title || 'تأكيد العملية',
        message: opts.message,
        confirmText: opts.confirmText || 'تأكيد',
        cancelText: opts.cancelText || 'إلغاء',
        variant: opts.variant || 'warning',
        resolve,
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  // Keyboard navigation (Escape to dismiss, auto focus on open)
  useEffect(() => {
    if (!dialog.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto-focus primary/cancel button after modal mounts
    const timeout = setTimeout(() => {
      if (dialog.type === 'confirm' && cancelButtonRef.current) {
        cancelButtonRef.current.focus();
      } else if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [dialog.isOpen, dialog.type]);

  const getVariantIcon = () => {
    switch (dialog.variant) {
      case 'danger':
        return (
          <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" aria-hidden="true" />
          </div>
        );
      case 'success':
        return (
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" aria-hidden="true" />
          </div>
        );
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}

      {/* Accessible Alert / Confirm Modal */}
      {dialog.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
          role="presentation"
          onClick={() => handleClose(false)}
        >
          <div
            ref={dialogContainerRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-desc"
            className="w-full max-w-sm sm:max-w-md bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-2xl p-5 sm:p-6 text-right space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Body */}
            <div className="flex items-start gap-3.5">
              {getVariantIcon()}
              <div className="space-y-1.5 flex-1 min-w-0">
                <h2
                  id="app-dialog-title"
                  className="text-base font-extrabold text-[var(--text-primary)] leading-snug"
                >
                  {dialog.title}
                </h2>
                <p
                  id="app-dialog-desc"
                  className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line"
                >
                  {dialog.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              {dialog.type === 'confirm' && (
                <Button
                  ref={cancelButtonRef}
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => handleClose(false)}
                  className="min-h-[44px] px-4 font-bold text-xs sm:text-sm"
                >
                  {dialog.cancelText}
                </Button>
              )}

              <Button
                ref={confirmButtonRef}
                type="button"
                variant={dialog.variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                onClick={() => handleClose(true)}
                className={`min-h-[44px] px-5 font-bold text-xs sm:text-sm ${
                  dialog.type === 'alert' ? 'w-full sm:w-auto' : ''
                }`}
              >
                {dialog.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a <DialogProvider>');
  }
  return context;
}

// Standalone Declarative AlertDialog component for cases where state is local
export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function AlertDialog({
  isOpen,
  title,
  message,
  variant = 'info',
  confirmText = 'حسناً',
  cancelText = 'إلغاء',
  isConfirm = false,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      role="presentation"
      onClick={() => (onCancel ? onCancel() : onConfirm())}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="custom-dialog-title"
        aria-describedby="custom-dialog-desc"
        className="w-full max-w-sm sm:max-w-md bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-2xl p-5 sm:p-6 text-right space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          {variant === 'danger' && (
            <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          {variant === 'warning' && (
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          {variant === 'success' && (
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          {variant === 'info' && (
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-6 h-6" aria-hidden="true" />
            </div>
          )}
          <div className="space-y-1.5 flex-1 min-w-0">
            <h2 id="custom-dialog-title" className="text-base font-extrabold text-[var(--text-primary)] leading-snug">
              {title}
            </h2>
            <p id="custom-dialog-desc" className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          {isConfirm && onCancel && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onCancel}
              className="min-h-[44px] px-4 font-bold text-xs sm:text-sm"
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            className={`min-h-[44px] px-5 font-bold text-xs sm:text-sm ${
              !isConfirm ? 'w-full sm:w-auto' : ''
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
