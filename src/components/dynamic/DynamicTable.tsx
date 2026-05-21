import React, { useState, useCallback } from 'react';
import {
  Search, Download, Plus, Trash2, RefreshCw, ChevronUp, ChevronDown,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Filter, Eye, Edit, MoreHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ModuleField, DynamicRecord, PaginationMeta } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface DynamicTableProps {
  fields: ModuleField[];
  data: DynamicRecord[];
  meta: PaginationMeta;
  loading?: boolean;
  title?: string;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onSort: (field: string, order: 'ASC' | 'DESC') => void;
  onAdd?: () => void;
  onView?: (record: DynamicRecord) => void;
  onEdit?: (record: DynamicRecord) => void;
  onDelete?: (id: string) => void;
  onExport?: () => void;
  onBulkDelete?: (ids: string[]) => void;
  onRefresh?: () => void;
  allowExport?: boolean;
  allowBulkDelete?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const DynamicTable: React.FC<DynamicTableProps> = ({
  fields,
  data,
  meta,
  loading = false,
  title,
  onPageChange,
  onSearch,
  onSort,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onExport,
  onBulkDelete,
  onRefresh,
  allowExport = true,
  allowBulkDelete = false,
  sortBy,
  sortOrder = 'DESC',
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchValue, setSearchValue] = useState('');

  const visibleFields = fields.filter((f) => f.showInList && !f.isHidden);

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((r) => r.id as string)));
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      onSearch(e.target.value);
    },
    [onSearch]
  );

  const handleSort = (columnName: string) => {
    if (sortBy === columnName) {
      onSort(columnName, sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      onSort(columnName, 'ASC');
    }
  };

  const renderCellValue = (field: ModuleField, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-surface-300 dark:text-surface-600">—</span>;
    }

    switch (field.fieldType) {
      case 'boolean':
        return (
          <Badge variant={value ? 'success' : 'default'} dot>
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      case 'select':
      case 'radio': {
        const opt = field.options?.find((o) => o.value === String(value));
        if (opt?.color) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${opt.color}20`, color: opt.color }}>
              {opt.label}
            </span>
          );
        }
        return <span>{opt?.label || String(value)}</span>;
      }
      case 'date':
        return <span>{new Date(value as string).toLocaleDateString()}</span>;
      case 'datetime':
        return <span>{new Date(value as string).toLocaleString()}</span>;
      case 'currency':
      case 'decimal':
        return <span className="font-mono">{Number(value).toFixed(2)}</span>;
      case 'image':
        return (
          <img src={value as string} alt="" className="w-8 h-8 rounded-lg object-cover" />
        );
      case 'email':
        return <a href={`mailto:${value}`} className="text-primary-600 hover:underline">{String(value)}</a>;
      case 'url':
        return <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate max-w-[200px] block">{String(value)}</a>;
      default:
        return <span className="truncate max-w-[200px] block" title={String(value)}>{String(value)}</span>;
    }
  };

  return (
    <div className="card overflow-hidden p-0">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-surface-100 dark:border-surface-800">
        {title && <h3 className="font-semibold text-surface-900 dark:text-surface-50 shrink-0">{title}</h3>}

        <div className="flex-1 flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-surface-200 bg-white dark:bg-surface-800 dark:border-surface-700 dark:text-surface-50 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {allowBulkDelete && selectedIds.size > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => { onBulkDelete?.(Array.from(selectedIds)); setSelectedIds(new Set()); }}
            >
              Delete ({selectedIds.size})
            </Button>
          )}
          {onRefresh && (
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={onRefresh} />
          )}
          {allowExport && onExport && (
            <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={onExport}>Export</Button>
          )}
          {onAdd && (
            <Button size="sm" icon={<Plus size={14} />} onClick={onAdd}>Add New</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50">
              {allowBulkDelete && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-surface-300"
                  />
                </th>
              )}
              {visibleFields.map((field) => (
                <th
                  key={field.id}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 whitespace-nowrap"
                  style={{ width: field.width || 150, minWidth: field.width || 100 }}
                >
                  {field.isSortable ? (
                    <button
                      onClick={() => handleSort(field.columnName)}
                      className="flex items-center gap-1 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                    >
                      {field.label || field.name}
                      <span className="flex flex-col">
                        <ChevronUp size={10} className={clsx(sortBy === field.columnName && sortOrder === 'ASC' ? 'text-primary-500' : 'opacity-30')} />
                        <ChevronDown size={10} className={clsx(sortBy === field.columnName && sortOrder === 'DESC' ? 'text-primary-500' : 'opacity-30')} />
                      </span>
                    </button>
                  ) : (
                    field.label || field.name
                  )}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {allowBulkDelete && <td className="px-4 py-3"><div className="w-4 h-4 bg-surface-200 rounded animate-pulse" /></td>}
                  {visibleFields.map((f) => (
                    <td key={f.id} className="px-4 py-3">
                      <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse" style={{ width: Math.random() * 100 + 60 }} />
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && <td className="px-4 py-3"><div className="w-20 h-4 bg-surface-200 rounded animate-pulse ml-auto" /></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleFields.length + (allowBulkDelete ? 1 : 0) + 1} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-surface-400">
                    <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                      <Search size={20} />
                    </div>
                    <p className="text-sm font-medium">No records found</p>
                    <p className="text-xs">Try changing your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr
                  key={record.id as string}
                  className="group hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                >
                  {allowBulkDelete && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id as string)}
                        onChange={() => handleSelect(record.id as string)}
                        className="rounded border-surface-300"
                      />
                    </td>
                  )}
                  {visibleFields.map((field) => (
                    <td key={field.id} className="px-4 py-3 text-surface-700 dark:text-surface-300">
                      {renderCellValue(field, record[field.columnName])}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onView && (
                          <button onClick={() => onView(record)} className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="View">
                            <Eye size={14} />
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(record)} className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(record.id as string)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-800">
          <p className="text-sm text-surface-500">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={!meta.hasPrev}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-surface-800"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={!meta.hasPrev}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-surface-800"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(meta.page - 2 + i, meta.totalPages - 4 + i));
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={clsx(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                    meta.page === page
                      ? 'bg-primary-500 text-white'
                      : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
                  )}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={!meta.hasNext}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-surface-800"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => onPageChange(meta.totalPages)}
              disabled={!meta.hasNext}
              className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-surface-800"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTable;
