import * as React from 'react';
import { cn } from './Button';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-sm transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'danger' | 'outline';
}) {
  const variants = {
    default: 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-transparent',
    success: 'bg-emerald-50 text-[var(--badge-avail)] border border-emerald-200',
    danger: 'bg-rose-50 text-[var(--accent-promo)] border border-rose-200',
    outline: 'border border-[var(--border-subtle)] text-[var(--text-secondary)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
