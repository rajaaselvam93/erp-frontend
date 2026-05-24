import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.service';
import DynamicTable from '../../components/dynamic/DynamicTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import type { User, ModuleField, PaginationMeta, Role, DynamicRecord } from '../../types';

const USER_FIELDS: ModuleField[] = [
  {
    id: '1', moduleId: '', name: 'First Name', columnName: 'firstName', fieldType: 'text',
    isRequired: true, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: true,
    isSortable: true, isFilterable: false, showInList: true, showInForm: true, showInDetail: true,
    validation: {}, options: [], colSpan: 1, sortOrder: 0, width: 130,
  },
  {
    id: '2', moduleId: '', name: 'Last Name', columnName: 'lastName', fieldType: 'text',
    isRequired: true, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: true,
    isSortable: true, isFilterable: false, showInList: true, showInForm: true, showInDetail: true,
    validation: {}, options: [], colSpan: 1, sortOrder: 1, width: 130,
  },
  {
    id: '3', moduleId: '', name: 'Email', columnName: 'email', fieldType: 'email',
    isRequired: true, isUnique: true, isReadOnly: false, isHidden: false, isSearchable: true,
    isSortable: true, isFilterable: false, showInList: true, showInForm: true, showInDetail: true,
    validation: {}, options: [], colSpan: 1, sortOrder: 2, width: 210,
  },
  {
    id: '6', moduleId: '', name: 'Role', columnName: 'roleName', fieldType: 'text',
    isRequired: false, isUnique: false, isReadOnly: true, isHidden: false, isSearchable: false,
    isSortable: false, isFilterable: false, showInList: true, showInForm: false, showInDetail: true,
    validation: {}, options: [], colSpan: 1, sortOrder: 3, width: 130,
  },
  {
    id: '4', moduleId: '', name: 'Department', columnName: 'department', fieldType: 'text',
    isRequired: false, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: false,
    isSortable: true, isFilterable: true, showInList: true, showInForm: true, showInDetail: true,
    validation: {}, options: [], colSpan: 1, sortOrder: 4, width: 130,
  },
  {
    id: '5', moduleId: '', name: 'Status', columnName: 'status', fieldType: 'select',
    isRequired: false, isUnique: false, isReadOnly: false, isHidden: false, isSearchable: false,
    isSortable: true, isFilterable: true, showInList: true, showInForm: true, showInDetail: true,
    validation: {}, colSpan: 1, sortOrder: 5, width: 110,
    options: [
      { label: 'Active', value: 'active', color: '#10b981' },
      { label: 'Inactive', value: 'inactive', color: '#71717a' },
      { label: 'Suspended', value: 'suspended', color: '#ef4444' },
      { label: 'Pending', value: 'pending', color: '#f59e0b' },
    ],
  },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Pending', value: 'pending' },
];

interface CreateUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
  department?: string;
  designation?: string;
  employeeId?: string;
}

interface EditUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleId: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  status: string;
}

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const {
    register: regCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors },
    reset: resetCreate,
  } = useForm<CreateUserFormData>();

  const {
    register: regEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    reset: resetEdit,
  } = useForm<EditUserFormData>();

  // Fetch all roles for dropdowns
  const { data: rolesData } = useQuery({
    queryKey: ['roles-all'],
    queryFn: async () => {
      const res = await api.get('/roles/all');
      return res.data.data as Role[];
    },
  });
  const roles = rolesData || [];
  const roleOptions = roles.map((r) => ({ label: r.name, value: r.id }));

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, sortBy, sortOrder],
    queryFn: async () => {
      const res = await api.get('/users', { params: { page, limit: 20, search, sortBy, sortOrder } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserFormData) => api.post('/users', data),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateForm(false);
      resetCreate();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserFormData }) =>
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
      resetEdit();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  // Pre-populate edit form when editUser changes
  useEffect(() => {
    if (editUser) {
      resetEdit({
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        email: editUser.email,
        phone: editUser.phone || '',
        roleId: editUser.roleId || '',
        department: editUser.department || '',
        designation: editUser.designation || '',
        employeeId: editUser.employeeId || '',
        status: editUser.status,
      });
    }
  }, [editUser, resetEdit]);

  const users: User[] = data?.data || [];
  const meta: PaginationMeta = data?.meta || {
    page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false,
  };

  // Flatten nested role.name for table display
  const tableData = users.map((u) => ({
    ...(u as unknown as Record<string, unknown>),
    roleName: (u as unknown as { role?: { name: string } }).role?.name || '—',
  }));

  const handleEditClick = (record: DynamicRecord) => {
    const user = users.find((u) => u.id === record.id);
    if (user) setEditUser(user);
  };

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
        data={tableData}
        meta={meta}
        loading={isLoading}
        title="User Management"
        onPageChange={setPage}
        onSearch={setSearch}
        onSort={(f, o) => { setSortBy(f); setSortOrder(o); }}
        onAdd={() => setShowCreateForm(true)}
        onEdit={handleEditClick}
        onDelete={(id) => deleteMutation.mutate(id)}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

      {/* ── Create User Modal ──────────────────────────────────── */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => { setShowCreateForm(false); resetCreate(); }}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleCreateSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name" required
              error={createErrors.firstName?.message}
              {...regCreate('firstName', { required: 'Required' })}
            />
            <Input
              label="Last Name" required
              error={createErrors.lastName?.message}
              {...regCreate('lastName', { required: 'Required' })}
            />
          </div>
          <Input
            label="Email" type="email" required
            error={createErrors.email?.message}
            {...regCreate('email', { required: 'Required' })}
          />
          <Input
            label="Password" type="password" required
            error={createErrors.password?.message}
            {...regCreate('password', {
              required: 'Required',
              minLength: { value: 8, message: 'Min 8 characters' },
            })}
          />
          <Select
            label="Role" required
            placeholder="Select a role..."
            options={roleOptions}
            error={createErrors.roleId?.message}
            {...regCreate('roleId', { required: 'Role is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" {...regCreate('department')} />
            <Input label="Employee ID" {...regCreate('employeeId')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button" variant="secondary"
              onClick={() => { setShowCreateForm(false); resetCreate(); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} icon={<UserPlus size={14} />}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit User Modal ────────────────────────────────────── */}
      <Modal
        isOpen={!!editUser}
        onClose={() => { setEditUser(null); resetEdit(); }}
        title="Edit User"
        size="md"
      >
        <form
          onSubmit={handleEditSubmit((d) => {
            if (!editUser) return;
            updateMutation.mutate({ id: editUser.id, data: d });
          })}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name" required
              error={editErrors.firstName?.message}
              {...regEdit('firstName', { required: 'Required' })}
            />
            <Input
              label="Last Name" required
              error={editErrors.lastName?.message}
              {...regEdit('lastName', { required: 'Required' })}
            />
          </div>
          <Input
            label="Email" type="email" required
            error={editErrors.email?.message}
            {...regEdit('email', { required: 'Required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role" required
              placeholder="Select a role..."
              options={roleOptions}
              error={editErrors.roleId?.message}
              {...regEdit('roleId', { required: 'Role is required' })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              {...regEdit('status')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" {...regEdit('department')} />
            <Input label="Designation" {...regEdit('designation')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" {...regEdit('phone')} />
            <Input label="Employee ID" {...regEdit('employeeId')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button" variant="secondary"
              onClick={() => { setEditUser(null); resetEdit(); }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending} icon={<Edit2 size={14} />}>
              Update User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
