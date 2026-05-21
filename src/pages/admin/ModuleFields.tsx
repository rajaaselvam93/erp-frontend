import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import {
  ArrowLeft, Plus, Trash2, Edit, GripVertical, Server, Copy, Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { moduleService } from '../../services/module.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import type { ModuleField, FieldType } from '../../types';

const FIELD_TYPES: { label: string; value: FieldType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Rich Text', value: 'richtext' },
  { label: 'Number', value: 'number' },
  { label: 'Decimal', value: 'decimal' },
  { label: 'Currency', value: 'currency' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'URL', value: 'url' },
  { label: 'Password', value: 'password' },
  { label: 'Date', value: 'date' },
  { label: 'Date & Time', value: 'datetime' },
  { label: 'Time', value: 'time' },
  { label: 'Boolean (Yes/No)', value: 'boolean' },
  { label: 'Select (Dropdown)', value: 'select' },
  { label: 'Multi-Select', value: 'multiselect' },
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'File Upload', value: 'file' },
  { label: 'Image Upload', value: 'image' },
  { label: 'Relation (Lookup)', value: 'relation' },
  { label: 'Color Picker', value: 'color' },
  { label: 'Rating', value: 'rating' },
  { label: 'Auto Number', value: 'autonumber' },
  { label: 'JSON', value: 'json' },
];

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'info', textarea: 'info', richtext: 'info',
  number: 'purple', decimal: 'purple', currency: 'purple',
  email: 'success', phone: 'success', url: 'success',
  date: 'warning', datetime: 'warning', time: 'warning',
  boolean: 'default', select: 'default', multiselect: 'default',
  file: 'error', image: 'error',
  relation: 'purple', autonumber: 'purple',
};

interface FieldFormData {
  name: string;
  fieldType: FieldType;
  label: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  isUnique: boolean;
  isSearchable: boolean;
  showInList: boolean;
  showInForm: boolean;
}

const defaultFieldValues: FieldFormData = {
  name: '',
  fieldType: 'text',
  label: '',
  placeholder: '',
  helpText: '',
  isRequired: false,
  isUnique: false,
  isSearchable: false,
  showInList: true,
  showInForm: true,
};

const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
    />
    <span className="text-sm text-surface-700 dark:text-surface-300">{label}</span>
  </label>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-1 p-0.5 rounded text-surface-400 hover:text-surface-600">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
};

const ModuleFields: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddField, setShowAddField] = useState(false);
  const [editField, setEditField] = useState<ModuleField | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ModuleField | null>(null);

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, watch } = useForm<FieldFormData>({
    defaultValues: defaultFieldValues,
  });

  const fieldName = watch('name');

  // Auto-derive label from name
  useEffect(() => {
    if (fieldName && !editField) {
      setValue('label', fieldName.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()).trim());
    }
  }, [fieldName, editField, setValue]);

  const { data: module, isLoading } = useQuery({
    queryKey: ['module-detail', id],
    queryFn: () => moduleService.getModule(id!),
    enabled: !!id,
  });

  const invalidateModuleCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['module-detail', id] });
    // Invalidate the module-by-slug cache so DynamicModule picks up the new fields immediately
    if (module?.slug) {
      queryClient.invalidateQueries({ queryKey: ['module-by-slug', module.slug] });
    }
  };

  const addFieldMutation = useMutation({
    mutationFn: (data: Partial<ModuleField>) => moduleService.addField(id!, data),
    onSuccess: () => {
      toast.success('Field added successfully');
      invalidateModuleCaches();
      setShowAddField(false);
      reset(defaultFieldValues);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to add field');
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: string; data: Partial<ModuleField> }) =>
      moduleService.updateField(id!, fieldId, data),
    onSuccess: () => {
      toast.success('Field updated');
      invalidateModuleCaches();
      setEditField(null);
      reset(defaultFieldValues);
    },
    onError: () => toast.error('Failed to update field'),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId: string) => moduleService.deleteField(id!, fieldId),
    onSuccess: () => {
      toast.success('Field deleted');
      invalidateModuleCaches();
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete field'),
  });

  const openEdit = (field: ModuleField) => {
    setEditField(field);
    reset({
      name: field.name,
      fieldType: field.fieldType,
      label: field.label || field.name,
      placeholder: field.placeholder || '',
      helpText: field.helpText || '',
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isSearchable: field.isSearchable,
      showInList: field.showInList,
      showInForm: field.showInForm,
    });
  };

  const closeModal = () => {
    setShowAddField(false);
    setEditField(null);
    reset(defaultFieldValues);
  };

  const onSubmit = (data: FieldFormData) => {
    if (editField) {
      updateFieldMutation.mutate({ fieldId: editField.id, data: data as unknown as Partial<ModuleField> });
    } else {
      addFieldMutation.mutate(data as unknown as Partial<ModuleField>);
    }
  };

  const userFields = (module?.fields ?? []).filter((f) => f.sortOrder >= 0);
  const coreFields = (module?.fields ?? []).filter((f) => f.sortOrder < 0);

  const baseUrl = window.location.origin.replace(':5173', ':5000');
  const apiBase = `${baseUrl}/api/v1/${module?.slug ?? '{module}'}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-surface-400">
        <p>Module not found.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/modules')}>Back to Modules</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/modules')}
          className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: module.color }}
          >
            <Server size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">{module.name} — Field Builder</h1>
            <p className="text-xs text-surface-400">/{module.slug} · {userFields.length} custom field{userFields.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { reset(defaultFieldValues); setShowAddField(true); }}>
          Add Field
        </Button>
      </div>

      {/* Auto-generated REST API info */}
      <Card>
        <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Auto-generated REST APIs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {[
            { method: 'GET', path: apiBase, color: 'text-emerald-600', label: 'Fetch all records' },
            { method: 'POST', path: apiBase, color: 'text-blue-600', label: 'Create a record' },
            { method: 'PATCH', path: apiBase, color: 'text-amber-600', label: 'Update a record (id in body)' },
            { method: 'DELETE', path: apiBase, color: 'text-red-600', label: 'Delete records (ids in body)' },
          ].map(({ method, path, color, label }) => (
            <div key={method + label} className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
              <span className={`font-bold w-14 shrink-0 ${color}`}>{method}</span>
              <span className="text-surface-500 truncate flex-1">{path}</span>
              <CopyButton text={path} />
            </div>
          ))}
        </div>
        <p className="text-xs text-surface-400 mt-2">Authentication: Bearer token in <code>Authorization</code> header.</p>
      </Card>

      {/* User-defined fields */}
      <Card>
        <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">Custom Fields</h2>
        {userFields.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 text-surface-400">
            <Plus size={32} strokeWidth={1.5} />
            <p className="text-sm">No custom fields yet. Add your first field.</p>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => { reset(defaultFieldValues); setShowAddField(true); }}>
              Add Field
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {userFields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 py-3 group">
                <GripVertical size={14} className="text-surface-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{field.label || field.name}</span>
                    <Badge
                      variant={(FIELD_TYPE_COLORS[field.fieldType] as 'info' | 'success' | 'warning' | 'error' | 'purple' | 'default') || 'default'}
                      size="sm"
                    >
                      {field.fieldType}
                    </Badge>
                    {field.isRequired && <Badge variant="error" size="sm">Required</Badge>}
                    {field.isUnique && <Badge variant="purple" size="sm">Unique</Badge>}
                  </div>
                  <p className="text-xs text-surface-400 font-mono">{field.columnName}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-surface-400 mr-2">
                    {[field.showInList && 'List', field.showInForm && 'Form', field.isSearchable && 'Search'].filter(Boolean).join(' · ')}
                  </span>
                  <button
                    onClick={() => openEdit(field)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    title="Edit field"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(field)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete field"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Core / system fields (read-only info) */}
      <Card>
        <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4">
          Core Fields <span className="text-xs font-normal text-surface-400">(auto-created, read-only)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {coreFields.map((field) => (
            <div key={field.id} className="flex items-center gap-2 bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-surface-500">{field.columnName}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Add / Edit Field Modal */}
      <Modal
        isOpen={showAddField || !!editField}
        onClose={closeModal}
        title={editField ? `Edit Field — ${editField.label || editField.name}` : 'Add New Field'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Field Name"
              placeholder="e.g. firstName, order_date"
              error={errors.name?.message}
              required
              {...register('name', {
                required: 'Field name is required',
                pattern: { value: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: 'Letters, numbers and underscores only, must start with a letter' },
              })}
            />
            <Select
              label="Field Type"
              options={FIELD_TYPES}
              required
              {...register('fieldType', { required: true })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Display Label"
              placeholder="Shown in forms and tables"
              {...register('label')}
            />
            <Input
              label="Placeholder"
              placeholder="Hint text inside the field"
              {...register('placeholder')}
            />
          </div>

          <Input
            label="Help Text"
            placeholder="Short description shown below the field"
            {...register('helpText')}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <Controller
              control={control}
              name="isRequired"
              render={({ field }) => (
                <CheckboxField label="Required" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="isUnique"
              render={({ field }) => (
                <CheckboxField label="Unique" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="isSearchable"
              render={({ field }) => (
                <CheckboxField label="Searchable" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="showInList"
              render={({ field }) => (
                <CheckboxField label="Show in list" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="showInForm"
              render={({ field }) => (
                <CheckboxField label="Show in form" checked={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button
              type="submit"
              loading={addFieldMutation.isPending || updateFieldMutation.isPending}
            >
              {editField ? 'Update Field' : 'Add Field'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Field"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteFieldMutation.isPending}
              onClick={() => deleteConfirm && deleteFieldMutation.mutate(deleteConfirm.id)}
            >
              Delete Field
            </Button>
          </>
        }
      >
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Delete field <strong>{deleteConfirm?.label || deleteConfirm?.name}</strong>?
          This will also drop the column <code className="text-xs bg-surface-100 dark:bg-surface-800 px-1 rounded">{deleteConfirm?.columnName}</code> from the database.
        </p>
      </Modal>
    </div>
  );
};

export default ModuleFields;
