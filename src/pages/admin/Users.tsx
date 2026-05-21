import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import DynamicTable from '../../components/dynamic/DynamicTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { useForm } from 'react-hook-form';
import type { User, ModuleField, PaginationMeta } from '../../types';

const USER_FIELDS: ModuleField[] = [
  { id: '1', moduleId: '', name: 'First Name', columnName: 'firstName', fieldType: 'text', isRequired: true, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: true, isSortable: true, isFilterable: false, showInList: true, showInForm: true, showInDetail: true, validation: {}, options: [], colSpan: 1, sortOrder: 0, width: 150 },
  { id: '2', moduleId: '', name: 'Last Name', columnName: 'lastName', fieldType: 'text', isRequired: true, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: true, isSortable: true, isFilterable: false, showInList: true, showInForm: true, showInDetail: true, validation: {}, options: [], colSpan: 1, sortOrder: 1, width: 150 },
  { id: '3', moduleId: '', name: 'Email', columnName: 'email', fieldType: 'email', isRequired: true, isUnique: true, isReadOnly: false, isHidden: false, isSearchable: true, isSortable: true, isFilterable: false, showInList: true, showInForm: true, showInDetail: true, validation: {}, options: [], colSpan: 1, sortOrder: 2, width: 200 },
  { id: '4', moduleId: '', name: 'Department', columnName: 'department', fieldType: 'text', isRequired: false, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: false, isSortable: true, isFilterable: true, showInList: true, showInForm: true, showInDetail: true, validation: {}, options: [], colSpan: 1, sortOrder: 3, width: 150 },
  {
    id: '5', moduleId: '', name: 'Status', columnName: 'status', fieldType: 'select', isRequired: false, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: false, isSortable: true, isFilterable: true, showInList: true, showInForm: true, showInDetail: true, validation: {}, colSpan: 1, sortOrder: 4, width: 120,
    options: [
      { label: 'Active', value: 'active', color: '#10b981' },
      { label: 'Inactive', value: 'inactive', color: '#71717a' },
      { label: 'Suspended', value: 'suspended', color: '#ef4444' },
    ],
  },
];

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, sortBy, sortOrder],
    queryFn: async () => {
      const res = await api.get('/users', { params: { page, limit: 20, search, sortBy, sortOrder } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/users', data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowForm(false);
      reset();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const users: User[] = data?.data || [];
  const meta: PaginationMeta = data?.meta || { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Users</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{meta.total} total users</p>
        </div>
      </div>

      <DynamicTable
        fields={USER_FIELDS}
        data={users as unknown as Record<string, unknown>[]}
        meta={meta}
        loading={isLoading}
        title="User Management"
        onPageChange={setPage}
        onSearch={setSearch}
        onSort={(f, o) => { setSortBy(f); setSortOrder(o); }}
        onAdd={() => setShowForm(true)}
        onDelete={(id) => deleteMutation.mutate(id)}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); reset(); }}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required error={errors.firstName?.message as string} {...register('firstName', { required: 'Required' })} />
            <Input label="Last Name" required error={errors.lastName?.message as string} {...register('lastName', { required: 'Required' })} />
          </div>
          <Input label="Email" type="email" required error={errors.email?.message as string} {...register('email', { required: 'Required' })} />
          <Input label="Password" type="password" required error={errors.password?.message as string} {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" {...register('department')} />
            <Input label="Employee ID" {...register('employeeId')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending} icon={<UserPlus size={14} />}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
