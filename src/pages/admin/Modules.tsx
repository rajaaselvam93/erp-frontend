import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Database, Edit, Trash2, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import { moduleService } from '../../services/module.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import type { Module } from '../../types';

const categoryOptions = [
  { label: 'Custom', value: 'custom' },
  { label: 'HRM', value: 'hrm' },
  { label: 'CRM', value: 'crm' },
  { label: 'Finance', value: 'finance' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Sales', value: 'sales' },
  { label: 'Purchase', value: 'purchase' },
  { label: 'Projects', value: 'projects' },
  { label: 'Support', value: 'support' },
];

const colorPresets = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#f97316'];

const defaultValues = {
  name: '',
  slug: '',
  description: '',
  icon: 'database',
  color: '#6366f1',
  category: 'custom',
};

const Modules: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Module | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    defaultValues,
  });

  // Populate form when editing
  useEffect(() => {
    if (editModule) {
      reset({
        name: editModule.name,
        slug: editModule.slug,
        description: editModule.description ?? '',
        icon: editModule.icon,
        color: editModule.color,
        category: editModule.category,
      });
    } else {
      reset(defaultValues);
    }
  }, [editModule, reset]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: () => moduleService.getModules({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Module>) => moduleService.createModule(data),
    onSuccess: () => {
      toast.success('Module created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      setShowCreate(false);
      reset(defaultValues);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create module');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Module> }) =>
      moduleService.updateModule(id, data),
    onSuccess: () => {
      toast.success('Module updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      setEditModule(null);
      reset(defaultValues);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update module');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      moduleService.updateModule(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moduleService.deleteModule(id),
    onSuccess: () => {
      toast.success('Module deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] });
      queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete module'),
  });

  const modules: Module[] = data?.data || [];
  const selectedColor = watch('color');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editModule) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setValue('slug', slug);
    }
  };

  const onSubmit = (formData: typeof defaultValues) => {
    if (editModule) {
      updateMutation.mutate({ id: editModule.id, data: formData as unknown as Partial<Module> });
    } else {
      createMutation.mutate(formData as unknown as Partial<Module>);
    }
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditModule(null);
    reset(defaultValues);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Module Manager</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Create and manage dynamic ERP modules
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { reset(defaultValues); setShowCreate(true); }}>
          Create Module
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-surface-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-200 rounded w-3/4" />
                    <div className="h-3 bg-surface-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Card key={mod.id} hover className="group">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
                  style={{ backgroundColor: mod.color }}
                >
                  <Database size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate">{mod.name}</h3>
                    {mod.isSystem && <Badge variant="purple" size="sm">System</Badge>}
                  </div>
                  <p className="text-xs text-surface-400 mb-2">/{mod.slug}</p>
                  {mod.description && (
                    <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">{mod.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={mod.isActive ? 'success' : 'default'} dot size="sm">
                      {mod.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="info" size="sm">{mod.category}</Badge>
                    {mod.fields && <Badge variant="default" size="sm">{mod.fields.length} fields</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={() => toggleMutation.mutate({ id: mod.id, isActive: !mod.isActive })}
                  disabled={mod.isSystem}
                  className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {mod.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                  {mod.isActive ? 'Enabled' : 'Disabled'}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/admin/modules/${mod.id}/fields`)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    title="Field Builder"
                  >
                    <Settings size={14} />
                  </button>
                  <button
                    onClick={() => setEditModule(mod)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50"
                    title="Edit"
                    disabled={mod.isSystem}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(mod)}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                    disabled={mod.isSystem}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {modules.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-surface-400">
              <Database size={40} strokeWidth={1.5} />
              <p className="font-medium">No modules yet</p>
              <p className="text-sm">Create your first dynamic module</p>
              <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
                Create Module
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Module Modal */}
      <Modal
        isOpen={showCreate || !!editModule}
        onClose={closeModal}
        title={editModule ? 'Edit Module' : 'Create New Module'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Module Name"
              placeholder="e.g. Employees, Products"
              error={errors.name?.message}
              required
              {...register('name', { required: 'Name is required', onChange: handleNameChange })}
            />
            <Input
              label="Slug (URL identifier)"
              placeholder="e.g. employees, products"
              error={errors.slug?.message}
              required
              disabled={!!editModule}
              {...register('slug', {
                required: 'Slug is required',
                pattern: { value: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens' },
              })}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Brief description of this module"
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-5">
            <Select
              label="Category"
              options={categoryOptions}
              {...register('category')}
            />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === color ? 'white' : 'transparent',
                      boxShadow: selectedColor === color ? `0 0 0 3px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editModule ? 'Update Module' : 'Create Module'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Module"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              Delete Module
            </Button>
          </>
        }
      >
        <p className="text-sm text-surface-600 dark:text-surface-400">
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
          This will also delete all records in this module's table.
        </p>
      </Modal>
    </div>
  );
};

export default Modules;
