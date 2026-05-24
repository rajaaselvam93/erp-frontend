/**
 * Shared visual components for ERP business module pages.
 * Provides consistent stat cards, page headers, search bars, tab bars,
 * table wrappers, pagination and action buttons.
 */
import React from 'react';
import { clsx } from 'clsx';
import { Search, Plus } from 'lucide-react';
import Button from '../ui/Button';

// ─── Page Header ─────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">{title}</h1>
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>
    </div>
    {action}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;   // Tailwind gradient class e.g. "from-primary-500 to-primary-700"
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient }) => (
  <div className={clsx(
    'relative rounded-2xl p-5 overflow-hidden text-white',
    'transition-all duration-200 hover:-translate-y-px hover:shadow-lg',
    'bg-gradient-to-br', gradient
  )}>
    <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/10" />
    <div className="absolute right-2 -bottom-4 w-12 h-12 rounded-full bg-white/5" />
    <div className="relative">
      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-white/70 mt-0.5 font-medium">{label}</p>
    </div>
  </div>
);

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
export const TabBar: React.FC<{
  tabs: readonly string[];
  active: string;
  onChange: (t: string) => void;
  labels?: Record<string, string>;
}> = ({ tabs, active, onChange, labels }) => (
  <div className="flex gap-1 border-b border-surface-100 dark:border-surface-800">
    {tabs.map(t => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={clsx(
          'px-4 py-2.5 text-xs font-semibold capitalize border-b-2 transition-all duration-150',
          active === t
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        )}
      >
        {labels?.[t] ?? t}
      </button>
    ))}
  </div>
);

// ─── Toolbar (Search + Actions) ───────────────────────────────────────────────
export const Toolbar: React.FC<{
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: React.ReactNode;
}> = ({ search, onSearch, placeholder = 'Search…', onAdd, addLabel = 'Add', children }) => (
  <div className="flex items-center justify-between gap-3 mb-4">
    <div className="relative flex-1 max-w-xs">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
      <input
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full pl-8 pr-3 py-2 text-xs rounded-xl',
          'border border-surface-200 dark:border-surface-700',
          'bg-white dark:bg-surface-800/60',
          'text-surface-900 dark:text-surface-100 placeholder:text-surface-400',
          'outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30',
          'transition-all duration-150'
        )}
      />
    </div>
    <div className="flex items-center gap-2">
      {children}
      {onAdd && (
        <Button onClick={onAdd} size="sm" icon={<Plus size={13} />}>{addLabel}</Button>
      )}
    </div>
  </div>
);

// ─── Table ────────────────────────────────────────────────────────────────────
export const Table: React.FC<{
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  colSpan?: number;
}> = ({ headers, children, emptyMessage = 'No data found', colSpan }) => (
  <div className="overflow-x-auto -mx-5 px-5">
    <table className="w-full text-sm min-w-max">
      <thead>
        <tr className="border-b border-surface-100 dark:border-surface-800">
          {headers.map(h => (
            <th key={h} className="text-left py-3 px-3 text-[10px] font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const EmptyRow: React.FC<{ colSpan: number; message?: string }> = ({ colSpan, message = 'No data found' }) => (
  <tr>
    <td colSpan={colSpan} className="py-14 text-center text-sm text-surface-400 dark:text-surface-500">
      {message}
    </td>
  </tr>
);

// ─── Table Row ────────────────────────────────────────────────────────────────
export const TR: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <tr
    onClick={onClick}
    className={clsx(
      'border-b border-surface-50 dark:border-surface-800/40',
      'transition-colors duration-100',
      'hover:bg-surface-50/80 dark:hover:bg-surface-800/30',
      onClick && 'cursor-pointer'
    )}
  >
    {children}
  </tr>
);

export const TD: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={clsx('py-3 px-3', className)}>{children}</td>
);

export const MonoCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="py-3 px-3 font-mono text-[11px] text-primary-600 dark:text-primary-400">{children}</td>
);

// ─── Action Buttons ───────────────────────────────────────────────────────────
export const ActionBtn: React.FC<{
  onClick: () => void;
  color?: 'default' | 'primary' | 'danger' | 'success' | 'warning';
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, color = 'default', title, children }) => {
  const colorMap = {
    default: 'text-surface-400 hover:text-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 dark:hover:text-surface-300',
    primary: 'text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400',
    danger:  'text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400',
    success: 'text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400',
    warning: 'text-surface-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:hover:text-amber-400',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx('p-1.5 rounded-lg transition-all duration-150', colorMap[color])}
    >
      {children}
    </button>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}> = ({ page, totalPages, total, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
      <span className="text-[11px] text-surface-400">{total} records</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={clsx(
            'h-7 px-3 rounded-lg text-xs font-medium transition-all duration-150',
            page === 1
              ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
              : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
          )}
        >
          Prev
        </button>
        <span className="h-7 px-3 flex items-center text-xs text-surface-500 dark:text-surface-400 font-medium">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={clsx(
            'h-7 px-3 rounded-lg text-xs font-medium transition-all duration-150',
            page === totalPages
              ? 'text-surface-300 dark:text-surface-600 cursor-not-allowed'
              : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ─── Select field (inline in forms) ──────────────────────────────────────────
export const FieldSelect: React.FC<{
  label?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, value, onChange, children, required }) => (
  <div>
    {label && (
      <label className="block text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5"> *</span>}
      </label>
    )}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={clsx(
        'w-full rounded-xl border border-surface-200 dark:border-surface-700',
        'bg-white dark:bg-surface-800/60',
        'px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100',
        'outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
        'dark:focus:border-primary-500 dark:focus:ring-primary-900/30',
        'transition-all duration-150'
      )}
    >
      {children}
    </select>
  </div>
);

// ─── Form footer ──────────────────────────────────────────────────────────────
export const FormFooter: React.FC<{
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}> = ({ onCancel, submitLabel = 'Save', loading }) => (
  <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-100 dark:border-surface-800 mt-2">
    <Button variant="outline" size="sm" onClick={onCancel} type="button">Cancel</Button>
    <Button type="submit" size="sm" loading={loading}>{submitLabel}</Button>
  </div>
);
