import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export const Card: React.FC<CardProps> = ({ children, className, padding = 'md', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-surface-100 shadow-soft',
        'dark:bg-surface-900 dark:border-surface-800/80',
        paddingClasses[padding],
        hover && 'cursor-pointer transition-all duration-200 hover:shadow-card hover:-translate-y-px hover:border-surface-200 dark:hover:border-surface-700',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, actions, icon, className }) => {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-5', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export const CardDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('border-t border-surface-100 dark:border-surface-800 -mx-5 my-4', className)} />
);

export default Card;
