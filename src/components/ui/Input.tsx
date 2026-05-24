import React from 'react';
import { clsx } from 'clsx';

// Supports two onChange signatures:
//   (value: string) => void   — used by ERP business module pages
//   React.ChangeEventHandler  — used by react-hook-form / native inputs
type StringHandler = (value: string) => void;
type EventHandler  = React.ChangeEventHandler<HTMLInputElement>;

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onIconRightClick?: () => void;
  onChange?: StringHandler | EventHandler;
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

const fieldBase = clsx(
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm',
  'text-surface-900 placeholder:text-surface-400',
  'outline-none transition-all duration-150',
  'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
  'disabled:bg-surface-50 disabled:cursor-not-allowed disabled:text-surface-400',
  'dark:bg-surface-800/60 dark:text-surface-50 dark:placeholder:text-surface-500',
  'dark:focus:border-primary-500 dark:focus:ring-primary-900/30',
);

const LabelEl: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wide">
    {children}
    {required && <span className="text-red-500 ml-0.5 normal-case font-normal tracking-normal"> *</span>}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, onIconRightClick, className, onChange, ...props }, ref) => {

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (!onChange) return;
      // If the caller accepts a plain string (length check isn't reliable for arrow fns,
      // so we try string first and fall back to event)
      try {
        (onChange as StringHandler)(e.target.value);
      } catch {
        (onChange as EventHandler)(e);
      }
    };

    return (
      <div className="w-full">
        {label && <LabelEl required={props.required}>{label}</LabelEl>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            onChange={onChange ? handleChange : undefined}
            className={clsx(
              fieldBase,
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-600'
                : 'border-surface-200 dark:border-surface-700',
              icon      && 'pl-9',
              iconRight && 'pr-9',
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
        {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-[11px] text-surface-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="w-full">
      {label && <LabelEl required={props.required}>{label}</LabelEl>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400',
          'outline-none transition-all duration-150 resize-y min-h-[90px]',
          'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
          'disabled:bg-surface-50 disabled:cursor-not-allowed',
          'dark:bg-surface-800/60 dark:text-surface-50 dark:border-surface-700',
          'dark:focus:border-primary-500 dark:focus:ring-primary-900/30',
          error ? 'border-red-300' : 'border-surface-200',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-[11px] text-surface-400">{hint}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, ...props }, ref) => (
    <div className="w-full">
      {label && <LabelEl required={props.required}>{label}</LabelEl>}
      <select
        ref={ref}
        className={clsx(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-surface-900',
          'outline-none transition-all duration-150',
          'focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
          'disabled:bg-surface-50 disabled:cursor-not-allowed',
          'dark:bg-surface-800/60 dark:text-surface-50 dark:border-surface-700',
          error ? 'border-red-300' : 'border-surface-200',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-[11px] text-surface-400">{hint}</p>}
    </div>
  )
);
Select.displayName = 'Select';

export default Input;
