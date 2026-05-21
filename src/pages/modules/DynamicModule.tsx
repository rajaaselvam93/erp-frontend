import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { moduleService } from '../../services/module.service';
import DynamicTable from '../../components/dynamic/DynamicTable';
import DynamicForm from '../../components/dynamic/DynamicForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { DynamicRecord, PaginationMeta } from '../../types';

const DynamicModule: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<DynamicRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<DynamicRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch module definition (field schema) independently so it is always
  // up-to-date even after the Field Builder adds/edits/removes fields.
  const { data: moduleDefinition } = useQuery({
    queryKey: ['module-by-slug', slug],
    queryFn: () => moduleService.getModuleBySlug(slug!),
    enabled: !!slug,
    staleTime: 0, // always re-fetch when navigating to the page
  });

  const queryKey = ['module-records', slug, page, search, sortBy, sortOrder];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      moduleService.getRecords(slug!, { page, limit: 20, search, sortBy, sortOrder }),
    enabled: !!slug,
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

  // Prefer the separately-fetched module definition; fall back to what
  // getRecords embeds in its response while the definition query is loading.
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

  if (!slug) return null;

  const moduleName = moduleDefinition?.name || data?.module?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{moduleName}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {meta.total} total records
          </p>
        </div>
      </div>

      {/* Dynamic Table */}
      <DynamicTable
        fields={fields}
        data={records}
        meta={meta}
        loading={isLoading}
        title={moduleName}
        onPageChange={setPage}
        onSearch={handleSearch}
        onSort={handleSort}
        onAdd={() => { setEditRecord(null); setShowForm(true); }}
        onView={setViewRecord}
        onEdit={(record) => { setEditRecord(record); setShowForm(true); }}
        onDelete={(id) => setDeleteConfirm(id)}
        onExport={handleExport}
        onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
        onRefresh={() => refetch()}
        allowExport={data?.module?.settings?.allowExport !== false}
        allowBulkDelete={data?.module?.settings?.allowBulkDelete === true}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* Create/Edit Modal */}
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

      {/* View Modal */}
      <Modal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title={`View ${moduleName}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewRecord(null)}>Close</Button>
            <Button onClick={() => { setEditRecord(viewRecord); setViewRecord(null); setShowForm(true); }}>Edit</Button>
          </>
        }
      >
        {viewRecord && (
          <div className="space-y-3">
            {fields.filter((f) => f.showInDetail && !f.isHidden).map((field) => (
              <div key={field.id} className="flex gap-4 py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                <span className="text-sm font-medium text-surface-500 w-36 shrink-0">{field.label || field.name}</span>
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
    </div>
  );
};

export default DynamicModule;
