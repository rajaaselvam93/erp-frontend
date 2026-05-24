import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Truck, CheckCircle, DollarSign, Plus, Search, Edit2, Trash2, CheckSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { procurementApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PO_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'default'> = {
  draft: 'default', submitted: 'warning', approved: 'success', sent: 'primary', partial: 'warning', received: 'success', cancelled: 'error',
};

const EMPTY_VENDOR = { vendorCode: '', vendorName: '', email: '', phone: '', taxRegistrationNo: '', paymentTerms: 'Net 30', currencyCode: 'USD', city: '', country: '', status: 'active' };
const EMPTY_PO = { poNumber: '', vendorId: '', orderDate: '', expectedDeliveryDate: '', currencyCode: 'USD', notes: '' };

const Procurement: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'purchase-orders' | 'vendors'>('purchase-orders');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_PO);

  const { data: stats } = useQuery({ queryKey: ['procurement-stats'], queryFn: procurementApi.getStats });
  const { data: vendorData } = useQuery({ queryKey: ['vendors'], queryFn: () => procurementApi.getVendors({ limit: 100 }) });
  const { data: poData, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search], queryFn: () => procurementApi.getPurchaseOrders({ page, limit: 20, search }),
    enabled: tab === 'purchase-orders',
  });
  const { data: vListData, isLoading: vLoading } = useQuery({
    queryKey: ['vendor-list', page, search], queryFn: () => procurementApi.getVendors({ page, limit: 20, search }),
    enabled: tab === 'vendors',
  });

  const vendors = vendorData?.data || [];

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (tab === 'vendors') return editing ? procurementApi.updateVendor(editing.id as string, data) : procurementApi.createVendor(data);
      return editing ? procurementApi.updatePurchaseOrder(editing.id as string, data) : procurementApi.createPurchaseOrder(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['vendors'] }); qc.invalidateQueries({ queryKey: ['vendor-list'] }); qc.invalidateQueries({ queryKey: ['procurement-stats'] }); setModalOpen(false); toast.success('Saved'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const approveMut = useMutation({
    mutationFn: procurementApi.approvePurchaseOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['procurement-stats'] }); toast.success('Purchase order approved'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => tab === 'vendors' ? procurementApi.deleteVendor(id) : procurementApi.deletePurchaseOrder(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['vendor-list'] }); toast.success('Deleted'); },
  });

  const openCreate = () => { setEditing(null); setForm(tab === 'vendors' ? EMPTY_VENDOR : EMPTY_PO); setModalOpen(true); };
  const openEdit = (rec: Record<string, unknown>) => { setEditing(rec); setForm({ ...rec }); setModalOpen(true); };

  const orders = poData?.data || [];
  const vList = vListData?.data || [];
  const meta = (tab === 'purchase-orders' ? poData?.meta : vListData?.meta) || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Procurement</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage vendors and purchase orders — Procure-to-Pay workflow</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Vendors', value: stats?.totalVendors ?? '-', icon: <Truck size={18} />, color: '#6366f1' },
          { label: 'Total POs', value: stats?.totalPOs ?? '-', icon: <ShoppingCart size={18} />, color: '#8b5cf6' },
          { label: 'Pending POs', value: stats?.pendingPOs ?? '-', icon: <CheckCircle size={18} />, color: '#f59e0b' },
          { label: 'Approved Amount', value: stats?.approvedAmount != null ? `$${Number(stats.approvedAmount).toLocaleString()}` : '-', icon: <DollarSign size={18} />, color: '#10b981' },
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
        {([['purchase-orders', 'Purchase Orders'], ['vendors', 'Vendors']] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(''); }} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{label}</button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <Button onClick={openCreate} size="sm"><Plus size={14} className="mr-1" />Add {tab === 'vendors' ? 'Vendor' : 'PO'}</Button>
        </div>

        {isLoading || vLoading ? <LoadingSpinner /> : tab === 'purchase-orders' ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 dark:border-surface-800">{['PO Number', 'Vendor', 'Order Date', 'Delivery Date', 'Total', 'Status', 'Actions'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {orders.map((o: Record<string, unknown>) => (
                <tr key={o.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <td className="py-3 px-3 font-mono text-xs text-primary-600 font-medium">{o.poNumber as string}</td>
                  <td className="py-3 px-3 font-medium">{(o.vendor as { vendorName: string } | undefined)?.vendorName || '-'}</td>
                  <td className="py-3 px-3 text-surface-500">{o.orderDate as string}</td>
                  <td className="py-3 px-3 text-surface-500">{o.expectedDeliveryDate as string || '-'}</td>
                  <td className="py-3 px-3 font-medium">{o.currencyCode as string} {Number(o.totalAmount || 0).toLocaleString()}</td>
                  <td className="py-3 px-3"><Badge variant={PO_STATUS_COLORS[o.status as string] || 'default'}>{o.status as string}</Badge></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      {o.status === 'submitted' && <button onClick={() => { if (confirm('Approve this PO?')) approveMut.mutate(o.id as string); }} className="p-1.5 text-surface-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve"><CheckSquare size={14} /></button>}
                      <button onClick={() => openEdit(o)} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(o.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-surface-400">No purchase orders</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-100 dark:border-surface-800">{['Code', 'Name', 'Contact', 'Payment Terms', 'Rating', 'Status', 'Actions'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {vList.map((v: Record<string, unknown>) => (
                <tr key={v.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <td className="py-3 px-3 font-mono text-xs text-primary-600">{v.vendorCode as string}</td>
                  <td className="py-3 px-3 font-medium">{v.vendorName as string}</td>
                  <td className="py-3 px-3 text-xs text-surface-500"><div>{v.email as string}</div><div>{v.phone as string}</div></td>
                  <td className="py-3 px-3 text-surface-600">{v.paymentTerms as string}</td>
                  <td className="py-3 px-3">{'★'.repeat(v.rating as number || 0)}{'☆'.repeat(5 - (v.rating as number || 0))}</td>
                  <td className="py-3 px-3"><Badge variant={v.status === 'active' ? 'success' : v.status === 'blacklisted' ? 'error' : 'default'}>{v.status as string}</Badge></td>
                  <td className="py-3 px-3"><div className="flex gap-2"><button onClick={() => openEdit(v)} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button><button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(v.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
              {vList.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-surface-400">No vendors</td></tr>}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${tab === 'vendors' ? 'Vendor' : 'Purchase Order'}`} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          {tab === 'vendors' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Vendor Code *" value={(form.vendorCode as string) || ''} onChange={v => setForm(f => ({ ...f, vendorCode: v }))} required />
              <Input label="Vendor Name *" value={(form.vendorName as string) || ''} onChange={v => setForm(f => ({ ...f, vendorName: v }))} required />
              <Input label="Email" type="email" value={(form.email as string) || ''} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <Input label="Phone" value={(form.phone as string) || ''} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <Input label="Tax Registration No" value={(form.taxRegistrationNo as string) || ''} onChange={v => setForm(f => ({ ...f, taxRegistrationNo: v }))} />
              <Input label="Payment Terms" value={(form.paymentTerms as string) || 'Net 30'} onChange={v => setForm(f => ({ ...f, paymentTerms: v }))} />
              <Input label="City" value={(form.city as string) || ''} onChange={v => setForm(f => ({ ...f, city: v }))} />
              <Input label="Country" value={(form.country as string) || ''} onChange={v => setForm(f => ({ ...f, country: v }))} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Input label="PO Number *" value={(form.poNumber as string) || ''} onChange={v => setForm(f => ({ ...f, poNumber: v }))} required />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Vendor *</label>
                <select value={(form.vendorId as string) || ''} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  <option value="">Select Vendor</option>
                  {vendors.map((v: Record<string, unknown>) => <option key={v.id as string} value={v.id as string}>{v.vendorName as string}</option>)}
                </select>
              </div>
              <Input label="Order Date *" type="date" value={(form.orderDate as string) || ''} onChange={v => setForm(f => ({ ...f, orderDate: v }))} required />
              <Input label="Expected Delivery Date" type="date" value={(form.expectedDeliveryDate as string) || ''} onChange={v => setForm(f => ({ ...f, expectedDeliveryDate: v }))} />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Status</label>
                <select value={(form.status as string) || 'draft'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  {['draft', 'submitted', 'approved', 'sent', 'partial', 'received', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Total Amount" type="number" value={(form.totalAmount as string) || ''} onChange={v => setForm(f => ({ ...f, totalAmount: v }))} />
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

export default Procurement;
