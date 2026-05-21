import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Edit, Trash2, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import type { Role } from '../../types';

const Roles: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => { const r = await api.get('/roles'); return r.data; },
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => { const r = await api.get('/roles/permissions'); return r.data.data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/roles', { ...data, permissionIds: selectedPermissions }),
    onSuccess: () => {
      toast.success('Role created');
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setShowCreate(false);
      reset();
      setSelectedPermissions([]);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => { toast.success('Role deleted'); queryClient.invalidateQueries({ queryKey: ['admin-roles'] }); },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Cannot delete role');
    },
  });

  const roles: Role[] = rolesData?.data || [];
  const permissions: Record<string, { id: string; name: string; slug: string }[]> = permissionsData || {};

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const levelBadge = (level: number) => {
    if (level >= 90) return <Badge variant="danger">Super</Badge>;
    if (level >= 50) return <Badge variant="warning">Manager</Badge>;
    return <Badge variant="default">User</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Roles & Permissions</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manage user roles and access control</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => { reset(); setSelectedPermissions([]); setShowCreate(true); }}>
          Create Role
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><div className="h-20 animate-pulse bg-surface-100 rounded-xl" /></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} hover>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-surface-900 dark:text-surface-50 truncate">{role.name}</h3>
                    {role.isSystem && <Badge variant="purple" size="sm">System</Badge>}
                  </div>
                  <p className="text-xs text-surface-400">{role.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {levelBadge(role.level)}
                    <Badge variant="info" size="sm">Level {role.level}</Badge>
                    {role.permissions && <Badge variant="default" size="sm">{role.permissions.length} perms</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={() => { setEditRole(role); setShowCreate(true); }}
                  disabled={role.isSystem}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(role.id)}
                  disabled={role.isSystem}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setEditRole(null); reset(); }}
        title={editRole ? 'Edit Role' : 'Create Role'}
        size="xl"
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Role Name" required error={errors.name?.message as string} {...register('name', { required: 'Required' })} />
            <Input label="Slug" required placeholder="e.g. manager" error={errors.slug?.message as string}
              {...register('slug', { required: 'Required', pattern: { value: /^[a-z0-9-]+$/, message: 'Lowercase, numbers, hyphens only' } })}
            />
          </div>
          <Textarea label="Description" {...register('description')} />

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Permissions</label>
            <div className="space-y-4 max-h-64 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-xl p-4">
              {Object.entries(permissions).map(([module, perms]) => (
                <div key={module}>
                  <p className="text-xs font-semibold uppercase text-surface-500 mb-2 capitalize">{module}</p>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedPermissions.includes(perm.id)
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200'
                        }`}
                      >
                        {selectedPermissions.includes(perm.id) && <Check size={10} />}
                        {perm.name.split(' - ')[1] || perm.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-2">{selectedPermissions.length} permissions selected</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setEditRole(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>{editRole ? 'Update' : 'Create Role'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Roles;
