import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, onIconRightClick, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400',
              'outline-none transition-all duration-150',
              'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
              'disabled:bg-surface-50 disabled:cursor-not-allowed disabled:text-surface-400',
              'dark:bg-surface-800 dark:text-surface-50 dark:placeholder:text-surface-500',
              'dark:focus:border-primary-500 dark:focus:ring-primary-900/20',
              error
                ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:border-red-500'
                : 'border-surface-200 dark:border-surface-700',
              icon && 'pl-10',
              iconRight && 'pr-10',
              className
            )}
            {...props}
          />
          {iconRight && (
            <button
              type="button"
              onClick={onIconRightClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {iconRight}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400',
            'outline-none transition-all duration-150 resize-y min-h-[100px]',
            'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
            'disabled:bg-surface-50 disabled:cursor-not-allowed',
            'dark:bg-surface-800 dark:text-surface-50 dark:border-surface-700',
            'dark:focus:border-primary-500 dark:focus:ring-primary-900/20',
            error ? 'border-red-400' : 'border-surface-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-surface-900',
            'outline-none transition-all duration-150 appearance-none',
            'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
            'disabled:bg-surface-50 disabled:cursor-not-allowed',
            'dark:bg-surface-800 dark:text-surface-50 dark:border-surface-700',
            error ? 'border-red-400' : 'border-surface-200',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
