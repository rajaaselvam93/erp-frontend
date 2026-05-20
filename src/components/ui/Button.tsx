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
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow disabled:bg-primary-300',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 active:bg-surface-300 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700',
  ghost: 'text-surface-600 hover:bg-surface-100 active:bg-surface-200 dark:text-surface-400 dark:hover:bg-surface-800',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-300',
  outline: 'border border-surface-200 text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg gap-1.5',
  sm: 'h-8 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-base rounded-xl gap-2',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconRight,
    fullWidth = false,
    disabled,
    children,
    className,
    ...props
  }, ref) => {
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
          <Loader2 className="animate-spin" size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
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
