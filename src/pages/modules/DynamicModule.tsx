import React, { useState, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { moduleService } from '../../services/module.service';
import { useAuth } from '../../hooks/useAuth';
import DynamicTable from '../../components/dynamic/DynamicTable';
import DynamicForm from '../../components/dynamic/DynamicForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { DynamicRecord, PaginationMeta } from '../../types';

const DynamicModule: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<DynamicRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<DynamicRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Per-module permission flags — computed once per slug
  const canRead   = hasPermission(`${slug}.read`);
  const canCreate = hasPermission(`${slug}.create`);
  const canUpdate = hasPermission(`${slug}.update`);
  const canDelete = hasPermission(`${slug}.delete`);
  const canExport = hasPermission(`${slug}.export`);

  // Access gate: user must have at least ONE permission for this module.
  // (read-only, create-only, etc. are all valid reasons to land on this page)
  const hasAnyAccess = canRead || canCreate || canUpdate || canDelete || canExport
    || hasPermission(`${slug}.import`);

  // Fetch module definition (field schema) if user has any access
  const { data: moduleDefinition } = useQuery({
    queryKey: ['module-by-slug', slug],
    queryFn: () => moduleService.getModuleBySlug(slug!),
    enabled: !!slug && hasAnyAccess,
    staleTime: 0,
  });

  const queryKey = ['module-records', slug, page, search, sortBy, sortOrder];

  // Only fetch records when user can actually read them
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      moduleService.getRecords(slug!, { page, limit: 20, search, sortBy, sortOrder }),
    enabled: !!slug && canRead,
  });

  const createMutation = useMutation({
    mutationFn: (formData: Record<string, unknown>) =>
      moduleService.createRecord(slug!, formData),
    onSuccess: () => {
      toast.success('Record created successfully');
      queryClient.invalidateQueries({ queryKey: ['module-records', slug] });
      setShowForm(false);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create record');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: formData }: { id: string; data: Record<string, unknown> }) =>
      moduleService.updateRecord(slug!, id, formData),
    onSuccess: () => {
      toast.success('Record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['module-records', slug] });
      setEditRecord(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moduleService.deleteRecord(slug!, id),
    onSuccess: () => {
      toast.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['module-records', slug] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete record'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => moduleService.bulkDelete(slug!, ids),
    onSuccess: (result) => {
      toast.success(`${result.deleted} records deleted`);
      queryClient.invalidateQueries({ queryKey: ['module-records', slug] });
    },
  });

  const handleExport = async () => {
    try {
      const blob = await moduleService.exportRecords(slug!, 'xlsx');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-export.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleSort = useCallback((field: string, order: 'ASC' | 'DESC') => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  if (!slug) return null;

  // User has no access to this module at all
  if (!hasAnyAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">Access Denied</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            You don't have permission to view this module.
          </p>
        </div>
      </div>
    );
  }

  // API returned 403 (e.g., user manually typed URL)
  const is403 = isError && (error as { response?: { status?: number } })?.response?.status === 403;
  if (is403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">Access Denied</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            You don't have permission to access this module.
          </p>
        </div>
      </div>
    );
  }

  const fields = moduleDefinition?.fields || data?.module?.fields || [];
  const records = data?.data || [];
  const meta: PaginationMeta = {
    page: data?.page || 1,
    limit: data?.limit || 20,
    total: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / (data?.limit || 20)),
    hasNext: (data?.page || 1) < Math.ceil((data?.total || 0) / (data?.limit || 20)),
    hasPrev: (data?.page || 1) > 1,
  };

  const moduleName = moduleDefinition?.name || data?.module?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{moduleName}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {meta.total} total records
          </p>
        </div>
      </div>

      <DynamicTable
        fields={fields}
        data={records}
        meta={meta}
        loading={isLoading}
        title={moduleName}
        onPageChange={setPage}
        onSearch={handleSearch}
        onSort={handleSort}
        onAdd={canCreate ? () => { setEditRecord(null); setShowForm(true); } : undefined}
        onView={setViewRecord}
        onEdit={canUpdate ? (record) => { setEditRecord(record); setShowForm(true); } : undefined}
        onDelete={canDelete ? (id) => setDeleteConfirm(id) : undefined}
        onExport={canExport && data?.module?.settings?.allowExport !== false ? handleExport : undefined}
        onBulkDelete={canDelete && data?.module?.settings?.allowBulkDelete === true
          ? (ids) => bulkDeleteMutation.mutate(ids)
          : undefined}
        onRefresh={() => refetch()}
        allowExport={canExport && data?.module?.settings?.allowExport !== false}
        allowBulkDelete={canDelete && data?.module?.settings?.allowBulkDelete === true}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Create / Edit Modal — only if user has the relevant permission */}
      {(canCreate || canUpdate) && (
        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          title={editRecord ? `Edit ${moduleName}` : `Add New ${moduleName}`}
          size="lg"
        >
          <DynamicForm
            fields={fields}
            defaultValues={editRecord || undefined}
            onSubmit={(formData) => {
              if (editRecord) {
                updateMutation.mutate({ id: editRecord.id as string, data: formData });
              } else {
                createMutation.mutate(formData);
              }
            }}
            onCancel={() => { setShowForm(false); setEditRecord(null); }}
            loading={createMutation.isPending || updateMutation.isPending}
            submitLabel={editRecord ? 'Update' : 'Create'}
          />
        </Modal>
      )}

      {/* View Modal */}
      <Modal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title={`View ${moduleName}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewRecord(null)}>Close</Button>
            {canUpdate && (
              <Button onClick={() => { setEditRecord(viewRecord); setViewRecord(null); setShowForm(true); }}>
                Edit
              </Button>
            )}
          </>
        }
      >
        {viewRecord && (
          <div className="space-y-3">
            {fields.filter((f) => f.showInDetail && !f.isHidden).map((field) => (
              <div
                key={field.id}
                className="flex gap-4 py-2 border-b border-surface-100 dark:border-surface-800 last:border-0"
              >
                <span className="text-sm font-medium text-surface-500 w-36 shrink-0">
                  {field.label || field.name}
                </span>
                <span className="text-sm text-surface-800 dark:text-surface-200">
                  {viewRecord[field.columnName] !== null && viewRecord[field.columnName] !== undefined
                    ? String(viewRecord[field.columnName])
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      {canDelete && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Delete"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default DynamicModule;
