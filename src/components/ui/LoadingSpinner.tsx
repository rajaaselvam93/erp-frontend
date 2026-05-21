import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-2',
  xl: 'w-16 h-16 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  fullPage = false,
}) => {
  const spinner = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', fullPage && 'h-full min-h-[60vh]', className)}>
      <div
        className={clsx(
          'rounded-full border-primary-200 border-t-primary-500 animate-spin',
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-surface-400 animate-pulse">{text}</p>}
    </div>
  );

  return spinner;
};

export const PageLoader: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-surface-950 z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg animate-pulse-soft">
        <span className="text-white font-bold text-xl">E</span>
      </div>
      <div className="w-24 h-1 bg-surface-100 rounded-full overflow-hidden dark:bg-surface-800">
        <div className="h-full bg-primary-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
