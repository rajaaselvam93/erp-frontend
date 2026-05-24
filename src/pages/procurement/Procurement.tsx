import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Truck, CheckCircle, DollarSign, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { procurementApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, TabBar, Toolbar, Table, TR, TD, MonoCell,
  EmptyRow, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const PO_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'default'> = {
  draft: 'default', submitted: 'warning', approved: 'success',
  sent: 'primary', partial: 'warning', received: 'success', cancelled: 'error',
};

const EMPTY_VENDOR = {
  vendorCode: '', vendorName: '', email: '', phone: '',
  taxRegistrationNo: '', paymentTerms: 'Net 30', currencyCode: 'USD',
  city: '', country: '', status: 'active',
};
const EMPTY_PO = {
  poNumber: '', vendorId: '', orderDate: '', expectedDeliveryDate: '',
  currencyCode: 'USD', status: 'draft', totalAmount: '', notes: '',
};

const TABS = ['purchase-orders', 'vendors'] as const;

const Procurement: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>('purchase-orders');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_PO);

  const { data: stats } = useQuery({ queryKey: ['procurement-stats'], queryFn: procurementApi.getStats });
  const { data: vendorData } = useQuery({ queryKey: ['vendors'], queryFn: () => procurementApi.getVendors({ limit: 100 }) });
  const { data: poData, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search],
    queryFn: () => procurementApi.getPurchaseOrders({ page, limit: 20, search }),
    enabled: tab === 'purchase-orders',
  });
  const { data: vListData, isLoading: vLoading } = useQuery({
    queryKey: ['vendor-list', page, search],
    queryFn: () => procurementApi.getVendors({ page, limit: 20, search }),
    enabled: tab === 'vendors',
  });

  const vendors = vendorData?.data || [];

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (tab === 'vendors') return editing ? procurementApi.updateVendor(editing.id as string, data) : procurementApi.createVendor(data);
      return editing ? procurementApi.updatePurchaseOrder(editing.id as string, data) : procurementApi.createPurchaseOrder(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['vendor-list'] });
      qc.invalidateQueries({ queryKey: ['procurement-stats'] });
      setModalOpen(false); setEditing(null); toast.success('Saved successfully');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const approveMut = useMutation({
    mutationFn: procurementApi.approvePurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['procurement-stats'] });
      toast.success('Purchase order approved');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => tab === 'vendors' ? procurementApi.deleteVendor(id) : procurementApi.deletePurchaseOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['vendor-list'] });
      qc.invalidateQueries({ queryKey: ['procurement-stats'] });
      toast.success('Deleted');
    },
  });

  const openCreate = () => { setEditing(null); setForm(tab === 'vendors' ? EMPTY_VENDOR : EMPTY_PO); setModalOpen(true); };
  const openEdit = (rec: Record<string, unknown>) => { setEditing(rec); setForm({ ...rec }); setModalOpen(true); };

  const orders = poData?.data || [];
  const vList = vListData?.data || [];
  const meta = (tab === 'purchase-orders' ? poData?.meta : vListData?.meta) || { total: 0, totalPages: 1 };
  const f = (k: string) => (form[k] as string) || '';
  const sf = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Procurement" subtitle="Manage vendors and purchase orders — Procure-to-Pay workflow" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Vendors"   value={stats?.totalVendors ?? '-'}                                                                    icon={<Truck size={15} />}        gradient="from-violet-500 to-purple-700" />
        <StatCard label="Total POs"        value={stats?.totalPOs ?? '-'}                                                                         icon={<ShoppingCart size={15} />} gradient="from-primary-500 to-primary-700" />
        <StatCard label="Pending POs"      value={stats?.pendingPOs ?? '-'}                                                                       icon={<CheckCircle size={15} />}  gradient="from-amber-500 to-orange-600" />
        <StatCard
          label="Approved Amount"
          value={stats?.approvedAmount != null ? `$${Number(stats.approvedAmount).toLocaleString()}` : '-'}
          icon={<DollarSign size={15} />}
          gradient="from-emerald-500 to-teal-600"
        />
      </div>

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={t => { setTab(t as typeof TABS[number]); setPage(1); setSearch(''); }}
        labels={{ 'purchase-orders': 'Purchase Orders', vendors: 'Vendors' }}
      />

      <Card>
        <Toolbar
          search={search}
          onSearch={v => { setSearch(v); setPage(1); }}
          placeholder={`Search ${tab === 'purchase-orders' ? 'purchase orders' : 'vendors'}…`}
          onAdd={openCreate}
          addLabel={tab === 'vendors' ? 'Add Vendor' : 'Add PO'}
        />

        {(isLoading || vLoading) ? <LoadingSpinner /> : tab === 'purchase-orders' ? (
          <Table headers={['PO Number', 'Vendor', 'Order Date', 'Delivery Date', 'Total', 'Status', 'Actions']}>
            {orders.map((o: Record<string, unknown>) => (
              <TR key={o.id as string}>
                <MonoCell>{o.poNumber as string}</MonoCell>
                <TD className="font-medium text-sm text-surface-900 dark:text-surface-100">
                  {(o.vendor as { vendorName: string } | undefined)?.vendorName || '—'}
                </TD>
                <TD className="text-surface-500 text-xs">{o.orderDate as string}</TD>
                <TD className="text-surface-500 text-xs">{(o.expectedDeliveryDate as string) || '—'}</TD>
                <TD className="font-semibold text-sm text-surface-800 dark:text-surface-200">
                  {o.currencyCode as string} {Number(o.totalAmount || 0).toLocaleString()}
                </TD>
                <TD><Badge variant={PO_STATUS_COLORS[o.status as string] || 'default'}>{o.status as string}</Badge></TD>
                <TD>
                  <div className="flex gap-1">
                    {o.status === 'submitted' && (
                      <ActionBtn color="success" onClick={() => { if (confirm('Approve this PO?')) approveMut.mutate(o.id as string); }} title="Approve">
                        <CheckSquare size={13} />
                      </ActionBtn>
                    )}
                    <ActionBtn color="primary" onClick={() => openEdit(o)} title="Edit"><Edit2 size={13} /></ActionBtn>
                    <ActionBtn color="danger" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(o.id as string); }} title="Delete"><Trash2 size={13} /></ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
            {orders.length === 0 && <EmptyRow colSpan={7} message="No purchase orders found" />}
          </Table>
        ) : (
          <Table headers={['Code', 'Name', 'Contact', 'Payment Terms', 'Rating', 'Status', 'Actions']}>
            {vList.map((v: Record<string, unknown>) => (
              <TR key={v.id as string}>
                <MonoCell>{v.vendorCode as string}</MonoCell>
                <TD>
                  <div className="font-semibold text-sm text-surface-900 dark:text-surface-100">{v.vendorName as string}</div>
                  <div className="text-[11px] text-surface-400">{v.city as string}{v.country ? `, ${v.country}` : ''}</div>
                </TD>
                <TD className="text-surface-400 text-[11px]">
                  <div>{v.email as string}</div>
                  <div>{v.phone as string}</div>
                </TD>
                <TD className="text-surface-500 text-xs">{v.paymentTerms as string}</TD>
                <TD className="text-amber-400 tracking-tighter text-sm">
                  {'★'.repeat((v.rating as number) || 0)}{'☆'.repeat(5 - ((v.rating as number) || 0))}
                </TD>
                <TD>
                  <Badge variant={v.status === 'active' ? 'success' : v.status === 'blacklisted' ? 'error' : 'default'}>
                    {v.status as string}
                  </Badge>
                </TD>
                <TD>
                  <div className="flex gap-1">
                    <ActionBtn color="primary" onClick={() => openEdit(v)} title="Edit"><Edit2 size={13} /></ActionBtn>
                    <ActionBtn color="danger" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(v.id as string); }} title="Delete"><Trash2 size={13} /></ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
            {vList.length === 0 && <EmptyRow colSpan={7} message="No vendors found" />}
          </Table>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${tab === 'vendors' ? 'Vendor' : 'Purchase Order'}`} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          {tab === 'vendors' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Vendor Code *" value={f('vendorCode')} onChange={sf('vendorCode')} required />
              <Input label="Vendor Name *" value={f('vendorName')} onChange={sf('vendorName')} required />
              <Input label="Email" type="email" value={f('email')} onChange={sf('email')} />
              <Input label="Phone" value={f('phone')} onChange={sf('phone')} />
              <Input label="Tax Registration No" value={f('taxRegistrationNo')} onChange={sf('taxRegistrationNo')} />
              <Input label="Payment Terms" value={f('paymentTerms') || 'Net 30'} onChange={sf('paymentTerms')} />
              <Input label="City" value={f('city')} onChange={sf('city')} />
              <Input label="Country" value={f('country')} onChange={sf('country')} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="PO Number *" value={f('poNumber')} onChange={sf('poNumber')} required />
              <FieldSelect label="Vendor *" value={f('vendorId')} onChange={sf('vendorId')} required>
                <option value="">Select Vendor</option>
                {vendors.map((v: Record<string, unknown>) => (
                  <option key={v.id as string} value={v.id as string}>{v.vendorName as string}</option>
                ))}
              </FieldSelect>
              <Input label="Order Date *" type="date" value={f('orderDate')} onChange={sf('orderDate')} required />
              <Input label="Expected Delivery Date" type="date" value={f('expectedDeliveryDate')} onChange={sf('expectedDeliveryDate')} />
              <FieldSelect label="Status" value={f('status') || 'draft'} onChange={sf('status')}>
                {['draft', 'submitted', 'approved', 'sent', 'partial', 'received', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </FieldSelect>
              <Input label="Total Amount" type="number" value={f('totalAmount')} onChange={sf('totalAmount')} />
            </div>
          )}
          <FormFooter onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update' : 'Create'} loading={saveMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default Procurement;
