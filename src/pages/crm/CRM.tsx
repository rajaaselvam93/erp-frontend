import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, Target, DollarSign, Plus, Search, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { crmApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const LEAD_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'default'> = {
  new: 'default', contacted: 'primary', qualified: 'warning', proposal: 'warning', negotiation: 'primary', won: 'success', lost: 'error',
};

const EMPTY_CUSTOMER = { customerCode: '', customerName: '', email: '', phone: '', industry: '', city: '', country: '', paymentTerms: 'Net 30', status: 'active' };
const EMPTY_LEAD = { firstName: '', lastName: '', email: '', phone: '', companyName: '', industry: '', leadSource: '', leadStatus: 'new', expectedRevenue: '', probability: '0' };

const CRM: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'customers' | 'leads'>('customers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_CUSTOMER);

  const { data: stats } = useQuery({ queryKey: ['crm-stats'], queryFn: crmApi.getStats });
  const { data: custData, isLoading: custLoading } = useQuery({
    queryKey: ['crm-customers', page, search], queryFn: () => crmApi.getCustomers({ page, limit: 20, search }), enabled: tab === 'customers',
  });
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['crm-leads', page, search], queryFn: () => crmApi.getLeads({ page, limit: 20, search }), enabled: tab === 'leads',
  });

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (tab === 'customers') return editing ? crmApi.updateCustomer(editing.id as string, data) : crmApi.createCustomer(data);
      return editing ? crmApi.updateLead(editing.id as string, data) : crmApi.createLead(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-customers'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); qc.invalidateQueries({ queryKey: ['crm-stats'] }); setModalOpen(false); setEditing(null); toast.success('Saved successfully'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => tab === 'customers' ? crmApi.deleteCustomer(id) : crmApi.deleteLead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-customers'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); qc.invalidateQueries({ queryKey: ['crm-stats'] }); toast.success('Deleted'); },
  });
  const convertMut = useMutation({
    mutationFn: crmApi.convertLead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-leads'] }); qc.invalidateQueries({ queryKey: ['crm-customers'] }); toast.success('Lead converted to customer!'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const openCreate = () => { setEditing(null); setForm(tab === 'customers' ? EMPTY_CUSTOMER : EMPTY_LEAD); setModalOpen(true); };
  const openEdit = (rec: Record<string, unknown>) => { setEditing(rec); setForm({ ...rec }); setModalOpen(true); };

  const customers = custData?.data || [];
  const leads = leadData?.data || [];
  const meta = (tab === 'customers' ? custData?.meta : leadData?.meta) || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Customer Relationship Management</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage customers, leads and sales pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Customers', value: stats?.totalCustomers ?? '-', icon: <Users size={18} />, color: '#ec4899' },
          { label: 'Total Leads', value: stats?.totalLeads ?? '-', icon: <Target size={18} />, color: '#6366f1' },
          { label: 'Active Leads', value: stats?.activeLeads ?? '-', icon: <TrendingUp size={18} />, color: '#f59e0b' },
          { label: 'Won Leads', value: stats?.wonLeads ?? '-', icon: <Users size={18} />, color: '#10b981' },
          { label: 'Pipeline Value', value: stats?.pipelineValue != null ? `$${Number(stats.pipelineValue).toLocaleString()}` : '-', icon: <DollarSign size={18} />, color: '#8b5cf6' },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs text-surface-500">{s.label}</p><p className="text-xl font-bold mt-0.5 text-surface-900 dark:text-surface-50">{s.value}</p></div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        {(['customers', 'leads'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(''); }} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{t}</button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={`Search ${tab}...`} className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <Button onClick={openCreate} size="sm"><Plus size={14} className="mr-1" />Add {tab === 'customers' ? 'Customer' : 'Lead'}</Button>
        </div>

        {(custLoading || leadLoading) ? <LoadingSpinner /> : tab === 'customers' ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 dark:border-surface-800">{['Code', 'Name', 'Industry', 'Contact', 'Payment Terms', 'Status', 'Actions'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {customers.map((c: Record<string, unknown>) => (
                <tr key={c.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <td className="py-3 px-3 font-mono text-xs text-primary-600">{c.customerCode as string}</td>
                  <td className="py-3 px-3"><div className="font-medium">{c.customerName as string}</div><div className="text-xs text-surface-400">{c.city as string}, {c.country as string}</div></td>
                  <td className="py-3 px-3 text-surface-600">{c.industry as string || '-'}</td>
                  <td className="py-3 px-3 text-surface-500 text-xs">{c.email as string}</td>
                  <td className="py-3 px-3 text-surface-600">{c.paymentTerms as string}</td>
                  <td className="py-3 px-3"><Badge variant={c.status === 'active' ? 'success' : 'error'}>{c.status as string}</Badge></td>
                  <td className="py-3 px-3"><div className="flex gap-2"><button onClick={() => openEdit(c)} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button><button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(c.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-surface-400">No customers</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 dark:border-surface-800">{['Name', 'Company', 'Source', 'Status', 'Revenue', 'Probability', 'Actions'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {leads.map((l: Record<string, unknown>) => (
                <tr key={l.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <td className="py-3 px-3"><div className="font-medium">{l.firstName as string} {l.lastName as string}</div><div className="text-xs text-surface-400">{l.email as string}</div></td>
                  <td className="py-3 px-3 text-surface-600">{l.companyName as string || '-'}</td>
                  <td className="py-3 px-3 text-surface-500">{l.leadSource as string || '-'}</td>
                  <td className="py-3 px-3"><Badge variant={LEAD_STATUS_COLORS[l.leadStatus as string] || 'default'}>{(l.leadStatus as string)?.replace('_', ' ')}</Badge></td>
                  <td className="py-3 px-3 font-medium">${Number(l.expectedRevenue || 0).toLocaleString()}</td>
                  <td className="py-3 px-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${l.probability}%` }} /></div><span className="text-xs text-surface-500">{l.probability as number}%</span></div></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      {!l.isConverted && <button onClick={() => { if (confirm('Convert to customer?')) convertMut.mutate(l.id as string); }} className="p-1.5 text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Convert to Customer"><ArrowRight size={14} /></button>}
                      <button onClick={() => openEdit(l)} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(l.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-surface-400">No leads</td></tr>}
            </tbody>
          </table>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${tab === 'customers' ? 'Customer' : 'Lead'}`} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          {tab === 'customers' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Customer Code *" value={(form.customerCode as string) || ''} onChange={v => setForm(f => ({ ...f, customerCode: v }))} required />
              <Input label="Customer Name *" value={(form.customerName as string) || ''} onChange={v => setForm(f => ({ ...f, customerName: v }))} required />
              <Input label="Email" type="email" value={(form.email as string) || ''} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <Input label="Phone" value={(form.phone as string) || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Industry" value={(form.industry as string) || ''} onChange={v => setForm(f => ({ ...f, industry: v }))} />
              <Input label="City" value={(form.city as string) || ''} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Country" value={(form.country as string) || ''} onChange={v => setForm(f => ({ ...f, country: v }))} />
              <Input label="Payment Terms" value={(form.paymentTerms as string) || 'Net 30'} onChange={v => setForm(f => ({ ...f, paymentTerms: v }))} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={(form.firstName as string) || ''} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
              <Input label="Last Name" value={(form.lastName as string) || ''} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
              <Input label="Email" type="email" value={(form.email as string) || ''} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <Input label="Phone" value={(form.phone as string) || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Company Name" value={(form.companyName as string) || ''} onChange={v => setForm(f => ({ ...f, companyName: v }))} />
              <Input label="Industry" value={(form.industry as string) || ''} onChange={v => setForm(f => ({ ...f, industry: v }))} />
              <Input label="Lead Source" value={(form.leadSource as string) || ''} onChange={v => setForm(f => ({ ...f, leadSource: v }))} />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Lead Status</label>
                <select value={(form.leadStatus as string) || 'new'} onChange={e => setForm(f => ({ ...f, leadStatus: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Expected Revenue" type="number" value={(form.expectedRevenue as string) || ''} onChange={v => setForm(f => ({ ...f, expectedRevenue: v }))} />
              <Input label="Probability (%)" type="number" value={(form.probability as string) || '0'} onChange={v => setForm(f => ({ ...f, probability: v }))} />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={saveMut.isPending}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CRM;
