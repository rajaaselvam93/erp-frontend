import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullPage?: boolean;
}

const sizeMap = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-2',
  xl: 'w-14 h-14 border-[3px]',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, text, fullPage = false }) => (
  <div className={clsx('flex flex-col items-center justify-center gap-3', fullPage && 'min-h-[50vh]', className)}>
    <div
      className={clsx(
        'rounded-full border-surface-200 border-t-primary-500 animate-spin dark:border-surface-700 dark:border-t-primary-400',
        sizeMap[size]
      )}
    />
    {text && <p className="text-xs text-surface-400 dark:text-surface-500">{text}</p>}
  </div>
);

export const PageLoader: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-[#0d0d0f] z-[9999]">
    <div className="flex flex-col items-center gap-5">
      {/* Logo mark */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <span className="text-white font-bold text-2xl tracking-tight">E</span>
        </div>
        <div className="absolute -inset-1 rounded-[18px] bg-gradient-to-br from-primary-400 to-primary-700 opacity-20 animate-pulse-soft -z-10" />
      </div>

      {/* Progress bar */}
      <div className="w-28 h-0.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
      </div>

      <p className="text-xs text-surface-400 dark:text-surface-500 tracking-wide">Loading…</p>
    </div>
  </div>
);

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3 px-4">
        <div className="h-4 skeleton rounded-lg" style={{ width: `${60 + (i % 3) * 20}%` }} />
      </td>
    ))}
  </tr>
);

export default LoadingSpinner;
