import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Building2, Plus, Search, Edit2, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { hrmsApi } from '../../services/erp.service';
import { Card, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  inactive: 'error',
  on_leave: 'warning',
  terminated: 'error',
};

const EMPTY_EMPLOYEE = { employeeCode: '', firstName: '', lastName: '', email: '', phone: '', joiningDate: '', employmentStatus: 'active', employmentType: 'full_time', departmentId: '', gender: '', city: '', country: '' };

const HRMS: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'employees' | 'departments'>('employees');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_EMPLOYEE);

  const { data: stats } = useQuery({ queryKey: ['hrms-stats'], queryFn: hrmsApi.getStats });
  const { data: empData, isLoading } = useQuery({
    queryKey: ['hrms-employees', page, search],
    queryFn: () => hrmsApi.getEmployees({ page, limit: 20, search }),
    enabled: tab === 'employees',
  });
  const { data: departments = [] } = useQuery({ queryKey: ['hrms-departments'], queryFn: hrmsApi.getDepartments });

  const createMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => editing ? hrmsApi.updateEmployee(editing.id as string, data) : hrmsApi.createEmployee(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-employees'] }); qc.invalidateQueries({ queryKey: ['hrms-stats'] }); setModalOpen(false); setEditing(null); setForm(EMPTY_EMPLOYEE); toast.success(editing ? 'Employee updated' : 'Employee created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: hrmsApi.deleteEmployee,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hrms-employees'] }); qc.invalidateQueries({ queryKey: ['hrms-stats'] }); toast.success('Employee deleted'); },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_EMPLOYEE); setModalOpen(true); };
  const openEdit = (emp: Record<string, unknown>) => { setEditing(emp); setForm({ ...emp }); setModalOpen(true); };

  const employees = empData?.data || [];
  const meta = empData?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Human Resource Management</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage employees, departments and payroll</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats?.totalEmployees ?? '-', icon: <Users size={18} />, color: '#6366f1' },
          { label: 'Active', value: stats?.activeEmployees ?? '-', icon: <UserCheck size={18} />, color: '#10b981' },
          { label: 'On Leave', value: stats?.onLeave ?? '-', icon: <Users size={18} />, color: '#f59e0b' },
          { label: 'Departments', value: stats?.departments ?? '-', icon: <Building2 size={18} />, color: '#8b5cf6' },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">{s.label}</p>
                <p className="text-2xl font-bold mt-1 text-surface-900 dark:text-surface-50">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        {(['employees', 'departments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search employees..." className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <Button onClick={openCreate} size="sm"><Plus size={14} className="mr-1" />Add Employee</Button>
          </div>

          {isLoading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    {['Code', 'Name', 'Department', 'Status', 'Type', 'Joining Date', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp: Record<string, unknown>) => (
                    <tr key={emp.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="py-3 px-3 font-mono text-xs text-primary-600">{emp.employeeCode as string}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-surface-900 dark:text-surface-100">{emp.firstName as string} {emp.lastName as string}</div>
                        <div className="text-xs text-surface-400">{emp.email as string}</div>
                      </td>
                      <td className="py-3 px-3 text-surface-600 dark:text-surface-400">{(emp.department as { departmentName: string } | undefined)?.departmentName || '-'}</td>
                      <td className="py-3 px-3"><Badge variant={STATUS_COLORS[emp.employmentStatus as string] || 'default'}>{emp.employmentStatus as string}</Badge></td>
                      <td className="py-3 px-3 capitalize text-surface-600 dark:text-surface-400">{(emp.employmentType as string)?.replace('_', ' ')}</td>
                      <td className="py-3 px-3 text-surface-500">{emp.joiningDate as string}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(emp)} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this employee?')) deleteMut.mutate(emp.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-surface-400">No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
              <span className="text-xs text-surface-500">Total: {meta.total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <span className="px-3 py-1.5 text-xs text-surface-600">{page} / {meta.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(departments as Record<string, unknown>[]).map((dept) => (
            <Card key={dept.id as string}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Building2 size={18} className="text-purple-600" /></div>
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">{dept.departmentName as string}</p>
                  <p className="text-xs text-surface-400">{dept.departmentCode as string} · {dept.costCenterCode as string}</p>
                </div>
              </div>
            </Card>
          ))}
          {(departments as Record<string, unknown>[]).length === 0 && <p className="text-surface-400 col-span-3 text-center py-8">No departments</p>}
        </div>
      )}

      {/* Employee Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee Code *" value={(form.employeeCode as string) || ''} onChange={v => setForm(f => ({ ...f, employeeCode: v }))} required />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Department</label>
              <select value={(form.departmentId as string) || ''} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select Department</option>
                {(departments as Record<string, unknown>[]).map(d => <option key={d.id as string} value={d.id as string}>{d.departmentName as string}</option>)}
              </select>
            </div>
            <Input label="First Name *" value={(form.firstName as string) || ''} onChange={v => setForm(f => ({ ...f, firstName: v }))} required />
            <Input label="Last Name *" value={(form.lastName as string) || ''} onChange={v => setForm(f => ({ ...f, lastName: v }))} required />
            <Input label="Email" type="email" value={(form.email as string) || ''} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <Input label="Phone" value={(form.phone as string) || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <Input label="Joining Date *" type="date" value={(form.joiningDate as string) || ''} onChange={v => setForm(f => ({ ...f, joiningDate: v }))} required />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Status</label>
              <select value={(form.employmentStatus as string) || 'active'} onChange={e => setForm(f => ({ ...f, employmentStatus: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['active', 'inactive', 'on_leave', 'terminated'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Employment Type</label>
              <select value={(form.employmentType as string) || 'full_time'} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['full_time', 'part_time', 'contract', 'intern'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Gender</label>
              <select value={(form.gender as string) || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select</option>
                {['male', 'female', 'other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" value={(form.city as string) || ''} onChange={v => setForm(f => ({ ...f, city: v }))} />
            <Input label="Country" value={(form.country as string) || ''} onChange={v => setForm(f => ({ ...f, country: v }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={createMut.isPending}>{editing ? 'Update' : 'Create'} Employee</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRMS;
