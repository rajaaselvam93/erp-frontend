import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, CheckSquare, Plus, Search, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { projectsApi, crmApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  planning: 'default', active: 'success', on_hold: 'warning', completed: 'success', cancelled: 'error',
  todo: 'default', in_progress: 'warning', review: 'warning', done: 'success',
};

const EMPTY_PROJECT = { projectCode: '', projectName: '', customerId: '', startDate: '', endDate: '', budget: '', status: 'planning', priority: 'medium', billingType: 'fixed_price', description: '' };
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
  const { data: customers = [] } = useQuery({ queryKey: ['crm-customers-all'], queryFn: () => crmApi.getCustomers({ limit: 200 }).then((r: { data: unknown }) => r.data) });
  const { data: tasks = [] } = useQuery({
    queryKey: ['proj-tasks', expandedProject],
    queryFn: () => projectsApi.getTasks(expandedProject!),
    enabled: !!expandedProject,
  });

  const projMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => editing ? projectsApi.updateProject(editing.id as string, data) : projectsApi.createProject(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); qc.invalidateQueries({ queryKey: ['proj-stats'] }); setModalOpen(false); setEditing(null); setForm(EMPTY_PROJECT); toast.success('Project saved'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteProjMut = useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); qc.invalidateQueries({ queryKey: ['proj-stats'] }); toast.success('Project deleted'); },
  });
  const taskMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.createTask(selectedProject!.id as string, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proj-tasks', selectedProject!.id] }); setTaskModalOpen(false); setTaskForm(EMPTY_TASK); toast.success('Task created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const projects = projData?.data || [];
  const meta = projData?.meta || { total: 0, totalPages: 1 };

  const priorityColor: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Projects</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Track projects, tasks and team productivity</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats?.totalProjects ?? '-', icon: <Briefcase size={18} />, color: '#6366f1' },
          { label: 'Active', value: stats?.activeProjects ?? '-', icon: <Briefcase size={18} />, color: '#10b981' },
          { label: 'Completed', value: stats?.completedProjects ?? '-', icon: <CheckSquare size={18} />, color: '#8b5cf6' },
          { label: 'On Hold', value: stats?.onHoldProjects ?? '-', icon: <Briefcase size={18} />, color: '#f59e0b' },
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

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search projects..." className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <Button onClick={() => { setEditing(null); setForm(EMPTY_PROJECT); setModalOpen(true); }} size="sm"><Plus size={14} className="mr-1" />New Project</Button>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {projects.map((proj: Record<string, unknown>) => (
              <div key={proj.id as string} className="border border-surface-100 dark:border-surface-800 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <button onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id as string)} className="text-surface-400 hover:text-surface-600 transition-transform" style={{ transform: expandedProject === proj.id ? 'rotate(90deg)' : 'none' }}>
                    <ChevronRight size={16} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary-600">{proj.projectCode as string}</span>
                      <span className="font-medium text-surface-900 dark:text-surface-100 truncate">{proj.projectName as string}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-surface-400">{(proj.customer as { customerName: string } | undefined)?.customerName || 'No customer'}</span>
                      <span className="text-xs text-surface-300">·</span>
                      <span className="text-xs text-surface-400">{proj.startDate as string} – {proj.endDate as string || 'ongoing'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-surface-400">Progress</p>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{proj.progressPercent as number}%</p>
                    </div>
                    <div className="w-20 bg-surface-100 dark:bg-surface-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${proj.progressPercent as number}%` }} />
                    </div>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityColor[proj.priority as string] || '#6b7280' }} title={proj.priority as string} />
                    <Badge variant={STATUS_COLORS[proj.status as string] || 'default'}>{(proj.status as string)?.replace('_', ' ')}</Badge>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => { setSelectedProject(proj); setTaskForm(EMPTY_TASK); setTaskModalOpen(true); }} className="p-1.5 text-surface-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Add Task"><Plus size={14} /></button>
                      <button onClick={() => { setEditing(proj); setForm({ ...proj }); setModalOpen(true); }} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => { if (confirm('Delete this project?')) deleteProjMut.mutate(proj.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>

                {expandedProject === proj.id && (
                  <div className="border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 px-4 py-3">
                    <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Tasks</p>
                    {(tasks as Record<string, unknown>[]).length === 0
                      ? <p className="text-xs text-surface-400 italic">No tasks yet. Click + to add tasks.</p>
                      : (
                        <div className="space-y-1">
                          {(tasks as Record<string, unknown>[]).map(task => (
                            <div key={task.id as string} className="flex items-center gap-3 py-1.5 px-3 bg-white dark:bg-surface-800 rounded-lg">
                              <Badge variant={STATUS_COLORS[task.status as string] || 'default'} className="text-xs">{task.status as string}</Badge>
                              <span className="text-sm text-surface-900 dark:text-surface-100 flex-1">{task.taskName as string}</span>
                              <span className="text-xs text-surface-400">{task.estimatedHours as number}h est.</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
            {projects.length === 0 && <p className="py-12 text-center text-surface-400">No projects found</p>}
          </div>
        )}

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

      {/* Project Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'} size="lg">
        <form onSubmit={e => { e.preventDefault(); projMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Project Code *" value={(form.projectCode as string) || ''} onChange={v => setForm(f => ({ ...f, projectCode: v }))} required />
            <Input label="Project Name *" value={(form.projectName as string) || ''} onChange={v => setForm(f => ({ ...f, projectName: v }))} required />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Customer</label>
              <select value={(form.customerId as string) || ''} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select Customer</option>
                {(customers as Record<string, unknown>[]).map(c => <option key={c.id as string} value={c.id as string}>{c.customerName as string}</option>)}
              </select>
            </div>
            <Input label="Budget" type="number" value={(form.budget as string) || ''} onChange={v => setForm(f => ({ ...f, budget: v }))} />
            <Input label="Start Date" type="date" value={(form.startDate as string) || ''} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
            <Input label="End Date" type="date" value={(form.endDate as string) || ''} onChange={v => setForm(f => ({ ...f, endDate: v }))} />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Status</label>
              <select value={(form.status as string) || 'planning'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Priority</label>
              <select value={(form.priority as string) || 'medium'} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Billing Type</label>
              <select value={(form.billingType as string) || 'fixed_price'} onChange={e => setForm(f => ({ ...f, billingType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['fixed_price', 'time_material', 'retainer', 'milestone'].map(b => <option key={b} value={b}>{b.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <Input label="Description" value={(form.description as string) || ''} onChange={v => setForm(f => ({ ...f, description: v }))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={projMut.isPending}>{editing ? 'Update' : 'Create'} Project</Button>
          </div>
        </form>
      </Modal>

      {/* Task Modal */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={`Add Task — ${selectedProject?.projectName as string || ''}`}>
        <form onSubmit={e => { e.preventDefault(); taskMut.mutate(taskForm); }} className="space-y-4">
          <Input label="Task Name *" value={(taskForm.taskName as string) || ''} onChange={v => setTaskForm(f => ({ ...f, taskName: v }))} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Status</label>
              <select value={(taskForm.status as string) || 'todo'} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['todo', 'in_progress', 'review', 'done', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Priority</label>
              <select value={(taskForm.priority as string) || 'medium'} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <Input label="Estimated Hours" type="number" value={(taskForm.estimatedHours as string) || ''} onChange={v => setTaskForm(f => ({ ...f, estimatedHours: v }))} />
          </div>
          <Input label="Description" value={(taskForm.description as string) || ''} onChange={v => setTaskForm(f => ({ ...f, description: v }))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setTaskModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={taskMut.isPending}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
