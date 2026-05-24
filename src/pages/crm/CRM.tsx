import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, Target, DollarSign, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { crmApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, TabBar, Toolbar, Table, TR, TD, MonoCell,
  EmptyRow, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const LEAD_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'default'> = {
  new: 'default', contacted: 'primary', qualified: 'warning',
  proposal: 'warning', negotiation: 'primary', won: 'success', lost: 'error',
};

const EMPTY_CUSTOMER = {
  customerCode: '', customerName: '', email: '', phone: '',
  industry: '', city: '', country: '', paymentTerms: 'Net 30', status: 'active',
};
const EMPTY_LEAD = {
  firstName: '', lastName: '', email: '', phone: '', companyName: '',
  industry: '', leadSource: '', leadStatus: 'new', expectedRevenue: '', probability: '0',
};

const TABS = ['customers', 'leads'] as const;

const CRM: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>('customers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_CUSTOMER);

  const { data: stats } = useQuery({ queryKey: ['crm-stats'], queryFn: crmApi.getStats });
  const { data: custData, isLoading: custLoading } = useQuery({
    queryKey: ['crm-customers', page, search],
    queryFn: () => crmApi.getCustomers({ page, limit: 20, search }),
    enabled: tab === 'customers',
  });
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['crm-leads', page, search],
    queryFn: () => crmApi.getLeads({ page, limit: 20, search }),
    enabled: tab === 'leads',
  });

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (tab === 'customers') return editing ? crmApi.updateCustomer(editing.id as string, data) : crmApi.createCustomer(data);
      return editing ? crmApi.updateLead(editing.id as string, data) : crmApi.createLead(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-customers'] });
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      qc.invalidateQueries({ queryKey: ['crm-stats'] });
      setModalOpen(false); setEditing(null); toast.success('Saved successfully');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => tab === 'customers' ? crmApi.deleteCustomer(id) : crmApi.deleteLead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-customers'] });
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      qc.invalidateQueries({ queryKey: ['crm-stats'] });
      toast.success('Deleted');
    },
  });
  const convertMut = useMutation({
    mutationFn: crmApi.convertLead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      qc.invalidateQueries({ queryKey: ['crm-customers'] });
      toast.success('Lead converted to customer!');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const openCreate = () => { setEditing(null); setForm(tab === 'customers' ? EMPTY_CUSTOMER : EMPTY_LEAD); setModalOpen(true); };
  const openEdit = (rec: Record<string, unknown>) => { setEditing(rec); setForm({ ...rec }); setModalOpen(true); };
  const customers = custData?.data || [];
  const leads = leadData?.data || [];
  const meta = (tab === 'customers' ? custData?.meta : leadData?.meta) || { total: 0, totalPages: 1 };
  const f = (k: string) => (form[k] as string) || '';
  const sf = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="CRM" subtitle="Manage customers, leads and your sales pipeline" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Customers"      value={stats?.totalCustomers ?? '-'} icon={<Users size={15} />}      gradient="from-pink-500 to-rose-600" />
        <StatCard label="Total Leads"    value={stats?.totalLeads ?? '-'}     icon={<Target size={15} />}     gradient="from-primary-500 to-primary-700" />
        <StatCard label="Active Leads"   value={stats?.activeLeads ?? '-'}    icon={<TrendingUp size={15} />} gradient="from-amber-500 to-orange-600" />
        <StatCard label="Won"            value={stats?.wonLeads ?? '-'}       icon={<Users size={15} />}      gradient="from-emerald-500 to-teal-600" />
        <StatCard
          label="Pipeline"
          value={stats?.pipelineValue != null ? `$${Number(stats.pipelineValue).toLocaleString()}` : '-'}
          icon={<DollarSign size={15} />}
          gradient="from-violet-500 to-purple-700"
        />
      </div>

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={t => { setTab(t as typeof TABS[number]); setPage(1); setSearch(''); }}
        labels={{ customers: 'Customers', leads: 'Leads' }}
      />

      <Card>
        <Toolbar
          search={search}
          onSearch={v => { setSearch(v); setPage(1); }}
          placeholder={`Search ${tab}…`}
          onAdd={openCreate}
          addLabel={tab === 'customers' ? 'Add Customer' : 'Add Lead'}
        />

        {(custLoading || leadLoading) ? <LoadingSpinner /> : tab === 'customers' ? (
          <Table headers={['Code', 'Name', 'Industry', 'Contact', 'Payment Terms', 'Status', 'Actions']}>
            {customers.map((c: Record<string, unknown>) => (
              <TR key={c.id as string}>
                <MonoCell>{c.customerCode as string}</MonoCell>
                <TD>
                  <div className="font-semibold text-sm text-surface-900 dark:text-surface-100">{c.customerName as string}</div>
                  <div className="text-[11px] text-surface-400">{c.city as string}{c.country ? `, ${c.country}` : ''}</div>
                </TD>
                <TD className="text-surface-500 text-xs">{c.industry as string || '—'}</TD>
                <TD className="text-surface-400 text-[11px]">{c.email as string}</TD>
                <TD className="text-surface-500 text-xs">{c.paymentTerms as string}</TD>
                <TD><Badge variant={c.status === 'active' ? 'success' : 'error'} dot>{c.status as string}</Badge></TD>
                <TD>
                  <div className="flex gap-1">
                    <ActionBtn color="primary" onClick={() => openEdit(c)} title="Edit"><Edit2 size={13} /></ActionBtn>
                    <ActionBtn color="danger" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(c.id as string); }} title="Delete"><Trash2 size={13} /></ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
            {customers.length === 0 && <EmptyRow colSpan={7} message="No customers found" />}
          </Table>
        ) : (
          <Table headers={['Name', 'Company', 'Source', 'Status', 'Revenue', 'Probability', 'Actions']}>
            {leads.map((l: Record<string, unknown>) => (
              <TR key={l.id as string}>
                <TD>
                  <div className="font-semibold text-sm text-surface-900 dark:text-surface-100">{l.firstName as string} {l.lastName as string}</div>
                  <div className="text-[11px] text-surface-400">{l.email as string}</div>
                </TD>
                <TD className="text-surface-500 text-xs">{l.companyName as string || '—'}</TD>
                <TD className="text-surface-400 text-xs">{l.leadSource as string || '—'}</TD>
                <TD><Badge variant={LEAD_STATUS_COLORS[l.leadStatus as string] || 'default'}>{(l.leadStatus as string)?.replace('_', ' ')}</Badge></TD>
                <TD className="font-semibold text-sm text-surface-800 dark:text-surface-200">${Number(l.expectedRevenue || 0).toLocaleString()}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${l.probability}%` }} />
                    </div>
                    <span className="text-[11px] text-surface-500">{l.probability as number}%</span>
                  </div>
                </TD>
                <TD>
                  <div className="flex gap-1">
                    {!l.isConverted && (
                      <ActionBtn color="success" onClick={() => { if (confirm('Convert to customer?')) convertMut.mutate(l.id as string); }} title="Convert to Customer">
                        <ArrowRight size={13} />
                      </ActionBtn>
                    )}
                    <ActionBtn color="primary" onClick={() => openEdit(l)} title="Edit"><Edit2 size={13} /></ActionBtn>
                    <ActionBtn color="danger" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(l.id as string); }} title="Delete"><Trash2 size={13} /></ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
            {leads.length === 0 && <EmptyRow colSpan={7} message="No leads found" />}
          </Table>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${tab === 'customers' ? 'Customer' : 'Lead'}`} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          {tab === 'customers' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Customer Code *" value={f('customerCode')} onChange={sf('customerCode')} required />
              <Input label="Customer Name *" value={f('customerName')} onChange={sf('customerName')} required />
              <Input label="Email" type="email" value={f('email')} onChange={sf('email')} />
              <Input label="Phone" value={f('phone')} onChange={sf('phone')} />
              <Input label="Industry" value={f('industry')} onChange={sf('industry')} />
              <Input label="City" value={f('city')} onChange={sf('city')} />
              <Input label="Country" value={f('country')} onChange={sf('country')} />
              <Input label="Payment Terms" value={f('paymentTerms') || 'Net 30'} onChange={sf('paymentTerms')} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={f('firstName')} onChange={sf('firstName')} />
              <Input label="Last Name"  value={f('lastName')}  onChange={sf('lastName')} />
              <Input label="Email" type="email" value={f('email')} onChange={sf('email')} />
              <Input label="Phone" value={f('phone')} onChange={sf('phone')} />
              <Input label="Company Name" value={f('companyName')} onChange={sf('companyName')} />
              <Input label="Industry" value={f('industry')} onChange={sf('industry')} />
              <Input label="Lead Source" value={f('leadSource')} onChange={sf('leadSource')} />
              <FieldSelect label="Lead Status" value={f('leadStatus') || 'new'} onChange={sf('leadStatus')}>
                {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </FieldSelect>
              <Input label="Expected Revenue" type="number" value={f('expectedRevenue')} onChange={sf('expectedRevenue')} />
              <Input label="Probability (%)" type="number" value={f('probability') || '0'} onChange={sf('probability')} />
            </div>
          )}
          <FormFooter onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update' : 'Create'} loading={saveMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default CRM;
