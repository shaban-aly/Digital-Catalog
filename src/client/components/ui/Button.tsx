import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm',
      secondary: 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)]',
      outline: 'border border-[var(--border-subtle)] bg-transparent hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]',
      ghost: 'bg-transparent hover:bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]',
      whatsapp: 'bg-[var(--whatsapp-green)] text-white hover:bg-[var(--whatsapp-dark)] shadow-md',
      danger: 'bg-[var(--accent-promo)] text-white hover:opacity-90 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
      md: 'h-11 px-4 text-sm rounded-[var(--radius-md)] min-h-[44px]', // 44px touch target for mobile ergonomics
      lg: 'h-13 px-6 text-base rounded-[var(--radius-lg)] min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
