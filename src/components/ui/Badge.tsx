import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'error' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  primary: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 dark:bg-primary-900/20 dark:text-primary-300 dark:ring-primary-700/30',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-700/30',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-700/30',
  danger:  'bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-700/30',
  error:   'bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-700/30',
  info:    'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-900/20 dark:text-sky-400 dark:ring-sky-700/30',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-700/30',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-surface-400',
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  error:   'bg-red-500',
  info:    'bg-sky-500',
  purple:  'bg-purple-500',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', dot = false, className }) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};

export default Badge;
