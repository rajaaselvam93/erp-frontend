import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, CheckSquare, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { projectsApi, crmApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, Toolbar, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  planning: 'default', active: 'success', on_hold: 'warning', completed: 'success', cancelled: 'error',
  todo: 'default', in_progress: 'warning', review: 'warning', done: 'success',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-400', medium: 'bg-amber-400', high: 'bg-red-500', critical: 'bg-violet-600',
};

const EMPTY_PROJECT = {
  projectCode: '', projectName: '', customerId: '', startDate: '', endDate: '',
  budget: '', status: 'planning', priority: 'medium', billingType: 'fixed_price', description: '',
};
const EMPTY_TASK = { taskName: '', description: '', status: 'todo', priority: 'medium', estimatedHours: '' };

const Projects: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_PROJECT);
  const [taskForm, setTaskForm] = useState<Record<string, unknown>>(EMPTY_TASK);
  const [selectedProject, setSelectedProject] = useState<Record<string, unknown> | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const { data: stats } = useQuery({ queryKey: ['proj-stats'], queryFn: projectsApi.getStats });
  const { data: projData, isLoading } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => projectsApi.getProjects({ page, limit: 20, search }),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['crm-customers-all'],
    queryFn: () => crmApi.getCustomers({ limit: 200 }).then((r: { data: unknown }) => r.data),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['proj-tasks', expandedProject],
    queryFn: () => projectsApi.getTasks(expandedProject!),
    enabled: !!expandedProject,
  });

  const projMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editing ? projectsApi.updateProject(editing.id as string, data) : projectsApi.createProject(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['proj-stats'] });
      setModalOpen(false); setEditing(null); setForm(EMPTY_PROJECT);
      toast.success('Project saved');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteProjMut = useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['proj-stats'] });
      toast.success('Project deleted');
    },
  });
  const taskMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.createTask(selectedProject!.id as string, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proj-tasks', selectedProject!.id] });
      setTaskModalOpen(false); setTaskForm(EMPTY_TASK);
      toast.success('Task created');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const projects = projData?.data || [];
  const meta = projData?.meta || { total: 0, totalPages: 1 };
  const f = (k: string) => (form[k] as string) || '';
  const sf = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const tf = (k: string) => (taskForm[k] as string) || '';
  const stf = (k: string) => (v: string) => setTaskForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" subtitle="Track projects, tasks and team productivity" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats?.totalProjects ?? '-'}    icon={<Briefcase size={15} />}   gradient="from-primary-500 to-primary-700" />
        <StatCard label="Active"         value={stats?.activeProjects ?? '-'}   icon={<Briefcase size={15} />}   gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Completed"      value={stats?.completedProjects ?? '-'} icon={<CheckSquare size={15} />} gradient="from-violet-500 to-purple-700" />
        <StatCard label="On Hold"        value={stats?.onHoldProjects ?? '-'}   icon={<Briefcase size={15} />}   gradient="from-amber-500 to-orange-600" />
      </div>

      <Card>
        <Toolbar
          search={search}
          onSearch={v => { setSearch(v); setPage(1); }}
          placeholder="Search projects…"
          onAdd={() => { setEditing(null); setForm(EMPTY_PROJECT); setModalOpen(true); }}
          addLabel="New Project"
        />

        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-2.5">
            {projects.map((proj: Record<string, unknown>) => (
              <div key={proj.id as string} className="border border-surface-100 dark:border-surface-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-50/80 dark:hover:bg-surface-800/30 transition-colors">
                  <button
                    onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id as string)}
                    className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-all duration-150 flex-shrink-0"
                    style={{ transform: expandedProject === proj.id ? 'rotate(90deg)' : 'none' }}
                  >
                    <ChevronRight size={15} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-primary-600 dark:text-primary-400">{proj.projectCode as string}</span>
                      <span className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{proj.projectName as string}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-surface-400">
                        {(proj.customer as { customerName: string } | undefined)?.customerName || 'No customer'}
                      </span>
                      <span className="text-surface-300 dark:text-surface-600">·</span>
                      <span className="text-[11px] text-surface-400">
                        {proj.startDate as string} – {(proj.endDate as string) || 'ongoing'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${proj.progressPercent as number}%` }} />
                      </div>
                      <span className="text-[11px] text-surface-500 w-8 text-right">{proj.progressPercent as number}%</span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[proj.priority as string] || 'bg-surface-400'}`}
                      title={proj.priority as string}
                    />
                    <Badge variant={STATUS_COLORS[proj.status as string] || 'default'}>
                      {(proj.status as string)?.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <ActionBtn color="success" onClick={() => { setSelectedProject(proj); setTaskForm(EMPTY_TASK); setTaskModalOpen(true); }} title="Add Task">
                        <Plus size={13} />
                      </ActionBtn>
                      <ActionBtn color="primary" onClick={() => { setEditing(proj); setForm({ ...proj }); setModalOpen(true); }} title="Edit">
                        <Edit2 size={13} />
                      </ActionBtn>
                      <ActionBtn color="danger" onClick={() => { if (confirm('Delete this project?')) deleteProjMut.mutate(proj.id as string); }} title="Delete">
                        <Trash2 size={13} />
                      </ActionBtn>
                    </div>
                  </div>
                </div>

                {expandedProject === proj.id && (
                  <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-900/40 px-5 py-3">
                    <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Tasks</p>
                    {(tasks as Record<string, unknown>[]).length === 0 ? (
                      <p className="text-xs text-surface-400 italic">No tasks yet. Click + to add tasks.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(tasks as Record<string, unknown>[]).map(task => (
                          <div key={task.id as string} className="flex items-center gap-3 py-2 px-3 bg-white dark:bg-surface-800 rounded-lg">
                            <Badge variant={STATUS_COLORS[task.status as string] || 'default'}>
                              {(task.status as string)?.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-surface-800 dark:text-surface-200 flex-1">{task.taskName as string}</span>
                            <span className="text-[11px] text-surface-400">{task.estimatedHours as number}h est.</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {projects.length === 0 && (
              <p className="py-14 text-center text-sm text-surface-400 dark:text-surface-500">No projects found</p>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      {/* Project Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'} size="lg">
        <form onSubmit={e => { e.preventDefault(); projMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Project Code *" value={f('projectCode')} onChange={sf('projectCode')} required />
            <Input label="Project Name *" value={f('projectName')} onChange={sf('projectName')} required />
            <FieldSelect label="Customer" value={f('customerId')} onChange={sf('customerId')}>
              <option value="">Select Customer</option>
              {(customers as Record<string, unknown>[]).map(c => (
                <option key={c.id as string} value={c.id as string}>{c.customerName as string}</option>
              ))}
            </FieldSelect>
            <Input label="Budget" type="number" value={f('budget')} onChange={sf('budget')} />
            <Input label="Start Date" type="date" value={f('startDate')} onChange={sf('startDate')} />
            <Input label="End Date" type="date" value={f('endDate')} onChange={sf('endDate')} />
            <FieldSelect label="Status" value={f('status') || 'planning'} onChange={sf('status')}>
              {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </FieldSelect>
            <FieldSelect label="Priority" value={f('priority') || 'medium'} onChange={sf('priority')}>
              {['low', 'medium', 'high', 'critical'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </FieldSelect>
            <FieldSelect label="Billing Type" value={f('billingType') || 'fixed_price'} onChange={sf('billingType')}>
              {['fixed_price', 'time_material', 'retainer', 'milestone'].map(b => (
                <option key={b} value={b}>{b.replace('_', ' ')}</option>
              ))}
            </FieldSelect>
          </div>
          <Input label="Description" value={f('description')} onChange={sf('description')} />
          <FormFooter onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update Project' : 'Create Project'} loading={projMut.isPending} />
        </form>
      </Modal>

      {/* Task Modal */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={`Add Task — ${(selectedProject?.projectName as string) || ''}`}>
        <form onSubmit={e => { e.preventDefault(); taskMut.mutate(taskForm); }} className="space-y-4">
          <Input label="Task Name *" value={tf('taskName')} onChange={stf('taskName')} required />
          <div className="grid grid-cols-2 gap-3">
            <FieldSelect label="Status" value={tf('status') || 'todo'} onChange={stf('status')}>
              {['todo', 'in_progress', 'review', 'done', 'cancelled'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </FieldSelect>
            <FieldSelect label="Priority" value={tf('priority') || 'medium'} onChange={stf('priority')}>
              {['low', 'medium', 'high', 'critical'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </FieldSelect>
            <Input label="Estimated Hours" type="number" value={tf('estimatedHours')} onChange={stf('estimatedHours')} />
          </div>
          <Input label="Description" value={tf('description')} onChange={stf('description')} />
          <FormFooter onCancel={() => setTaskModalOpen(false)} submitLabel="Create Task" loading={taskMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
