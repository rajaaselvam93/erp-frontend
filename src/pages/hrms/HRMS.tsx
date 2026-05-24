import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Building2, Edit2, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { hrmsApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, TabBar, Toolbar, Table, TR, TD, MonoCell,
  EmptyRow, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success', inactive: 'error', on_leave: 'warning', terminated: 'error',
};

const EMPTY_EMPLOYEE = {
  employeeCode: '', firstName: '', lastName: '', email: '', phone: '',
  joiningDate: '', employmentStatus: 'active', employmentType: 'full_time',
  departmentId: '', gender: '', city: '', country: '',
};

const TABS = ['employees', 'departments'] as const;

const HRMS: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>('employees');
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

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editing ? hrmsApi.updateEmployee(editing.id as string, data) : hrmsApi.createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-employees'] });
      qc.invalidateQueries({ queryKey: ['hrms-stats'] });
      setModalOpen(false); setEditing(null); setForm(EMPTY_EMPLOYEE);
      toast.success(editing ? 'Employee updated' : 'Employee created');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: hrmsApi.deleteEmployee,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms-employees'] });
      qc.invalidateQueries({ queryKey: ['hrms-stats'] });
      toast.success('Employee deleted');
    },
  });

  const employees = empData?.data || [];
  const meta = empData?.meta || { total: 0, totalPages: 1 };
  const f = (k: string) => (form[k] as string) || '';
  const sf = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Human Resources" subtitle="Manage employees, departments and workforce data" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? '-'} icon={<Users size={16} />}   gradient="from-primary-500 to-primary-700" />
        <StatCard label="Active"           value={stats?.activeEmployees ?? '-'} icon={<UserCheck size={16} />} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="On Leave"         value={stats?.onLeave ?? '-'}         icon={<Users size={16} />}   gradient="from-amber-500 to-orange-600" />
        <StatCard label="Departments"      value={stats?.departments ?? '-'}     icon={<Building2 size={16} />} gradient="from-violet-500 to-purple-700" />
      </div>

      <TabBar tabs={TABS} active={tab} onChange={t => { setTab(t as typeof TABS[number]); setPage(1); }} />

      {tab === 'employees' && (
        <Card>
          <Toolbar
            search={search}
            onSearch={v => { setSearch(v); setPage(1); }}
            placeholder="Search employees…"
            onAdd={() => { setEditing(null); setForm(EMPTY_EMPLOYEE); setModalOpen(true); }}
            addLabel="Add Employee"
          />

          {isLoading ? <LoadingSpinner /> : (
            <>
              <Table headers={['Code', 'Name', 'Department', 'Status', 'Type', 'Joined', 'Actions']}>
                {employees.map((emp: Record<string, unknown>) => (
                  <TR key={emp.id as string}>
                    <MonoCell>{emp.employeeCode as string}</MonoCell>
                    <TD>
                      <div className="font-semibold text-surface-900 dark:text-surface-100 text-sm">
                        {emp.firstName as string} {emp.lastName as string}
                      </div>
                      <div className="text-[11px] text-surface-400 mt-0.5">{emp.email as string}</div>
                    </TD>
                    <TD className="text-surface-500 dark:text-surface-400 text-xs">
                      {(emp.department as { departmentName: string } | undefined)?.departmentName || '—'}
                    </TD>
                    <TD>
                      <Badge variant={STATUS_COLORS[emp.employmentStatus as string] || 'default'} dot>
                        {(emp.employmentStatus as string)?.replace('_', ' ')}
                      </Badge>
                    </TD>
                    <TD className="text-surface-500 text-xs capitalize">
                      {(emp.employmentType as string)?.replace('_', ' ')}
                    </TD>
                    <TD className="text-surface-400 text-xs">{emp.joiningDate as string}</TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <ActionBtn color="primary" onClick={() => { setEditing(emp); setForm({ ...emp }); setModalOpen(true); }} title="Edit">
                          <Edit2 size={13} />
                        </ActionBtn>
                        <ActionBtn color="danger" onClick={() => { if (confirm('Delete this employee?')) deleteMut.mutate(emp.id as string); }} title="Delete">
                          <Trash2 size={13} />
                        </ActionBtn>
                      </div>
                    </TD>
                  </TR>
                ))}
                {employees.length === 0 && <EmptyRow colSpan={7} message="No employees found" />}
              </Table>
              <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
            </>
          )}
        </Card>
      )}

      {tab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(departments as Record<string, unknown>[]).map(dept => (
            <Card key={dept.id as string} hover>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-surface-900 dark:text-surface-100">{dept.departmentName as string}</p>
                  <p className="text-[11px] text-surface-400 mt-0.5">{dept.departmentCode as string} · {dept.costCenterCode as string}</p>
                </div>
              </div>
            </Card>
          ))}
          {(departments as Record<string, unknown>[]).length === 0 && (
            <p className="col-span-3 text-center py-12 text-sm text-surface-400">No departments found</p>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Employee Code *" value={f('employeeCode')} onChange={sf('employeeCode')} required />
            <FieldSelect label="Department" value={f('departmentId')} onChange={sf('departmentId')}>
              <option value="">Select Department</option>
              {(departments as Record<string, unknown>[]).map(d => (
                <option key={d.id as string} value={d.id as string}>{d.departmentName as string}</option>
              ))}
            </FieldSelect>
            <Input label="First Name *" value={f('firstName')} onChange={sf('firstName')} required />
            <Input label="Last Name *"  value={f('lastName')}  onChange={sf('lastName')}  required />
            <Input label="Email" type="email" value={f('email')} onChange={sf('email')} />
            <Input label="Phone" value={f('phone')} onChange={sf('phone')} />
            <Input label="Joining Date *" type="date" value={f('joiningDate')} onChange={sf('joiningDate')} required />
            <FieldSelect label="Status" value={f('employmentStatus') || 'active'} onChange={sf('employmentStatus')}>
              {['active', 'inactive', 'on_leave', 'terminated'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </FieldSelect>
            <FieldSelect label="Employment Type" value={f('employmentType') || 'full_time'} onChange={sf('employmentType')}>
              {['full_time', 'part_time', 'contract', 'intern'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </FieldSelect>
            <FieldSelect label="Gender" value={f('gender')} onChange={sf('gender')}>
              <option value="">Select</option>
              {['male', 'female', 'other'].map(s => <option key={s} value={s}>{s}</option>)}
            </FieldSelect>
            <Input label="City"    value={f('city')}    onChange={sf('city')} />
            <Input label="Country" value={f('country')} onChange={sf('country')} />
          </div>
          <FormFooter onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update Employee' : 'Create Employee'} loading={saveMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default HRMS;
