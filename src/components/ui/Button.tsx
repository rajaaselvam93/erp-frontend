import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-primary-500 to-primary-600 text-white ' +
    'hover:from-primary-400 hover:to-primary-500 ' +
    'shadow-sm hover:shadow-[0_4px_14px_0_rgba(99,102,241,0.35)] ' +
    'active:scale-[0.97] disabled:from-primary-300 disabled:to-primary-400 disabled:shadow-none',
  secondary:
    'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 ' +
    'dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700 active:scale-[0.97]',
  ghost:
    'text-surface-600 hover:bg-surface-100/80 active:bg-surface-200 ' +
    'dark:text-surface-400 dark:hover:bg-surface-800/60 active:scale-[0.97]',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 text-white ' +
    'hover:from-red-400 hover:to-red-500 shadow-sm ' +
    'hover:shadow-[0_4px_14px_0_rgba(239,68,68,0.30)] active:scale-[0.97] ' +
    'disabled:from-red-300 disabled:to-red-400 disabled:shadow-none',
  outline:
    'border border-surface-200 bg-white text-surface-700 ' +
    'hover:bg-surface-50 hover:border-surface-300 ' +
    'dark:border-surface-700 dark:bg-transparent dark:text-surface-300 ' +
    'dark:hover:bg-surface-800/60 active:scale-[0.97]',
  success:
    'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white ' +
    'hover:from-emerald-400 hover:to-emerald-500 shadow-sm ' +
    'hover:shadow-[0_4px_14px_0_rgba(16,185,129,0.30)] active:scale-[0.97] ' +
    'disabled:from-emerald-300 disabled:to-emerald-400 disabled:shadow-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1',
  sm: 'h-8 px-3 text-xs rounded-xl gap-1.5',
  md: 'h-9 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, iconRight, fullWidth = false, disabled, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === 'xs' ? 12 : size === 'sm' ? 13 : 14} />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0 ml-auto">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
