import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, FileText, Plus, Search, Edit2, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { salesApi, crmApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  draft: 'default', confirmed: 'warning', processing: 'warning', shipped: 'warning',
  delivered: 'success', cancelled: 'error', returned: 'error',
  unpaid: 'error', partial: 'warning', paid: 'success', overdue: 'error', sent: 'warning',
};

const EMPTY_ORDER = { orderNumber: '', customerId: '', orderDate: new Date().toISOString().split('T')[0], expectedDelivery: '', notes: '', lines: [] as Record<string, unknown>[] };
const EMPTY_INVOICE = { invoiceNumber: '', customerId: '', salesOrderId: '', invoiceDate: new Date().toISOString().split('T')[0], dueDate: '', subtotal: '', taxAmount: '', totalAmount: '', notes: '' };
const EMPTY_LINE = { itemDescription: '', quantity: '1', unitPrice: '', discountPercent: '0', taxPercent: '0' };

const Sales: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'orders' | 'invoices'>('orders');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [selectedInv, setSelectedInv] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_ORDER);
  const [invForm, setInvForm] = useState<Record<string, unknown>>(EMPTY_INVOICE);
  const [payAmount, setPayAmount] = useState('');
  const [invModalOpen, setInvModalOpen] = useState(false);

  const { data: stats } = useQuery({ queryKey: ['sales-stats'], queryFn: salesApi.getStats });
  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: ['sales-orders', page, search],
    queryFn: () => salesApi.getSalesOrders({ page, limit: 20, search }),
    enabled: tab === 'orders',
  });
  const { data: invoiceData, isLoading: invLoading } = useQuery({
    queryKey: ['sales-invoices', page, search],
    queryFn: () => salesApi.getInvoices({ page, limit: 20, search }),
    enabled: tab === 'invoices',
  });
  const { data: customers = [] } = useQuery({ queryKey: ['crm-customers-all'], queryFn: () => crmApi.getCustomers({ limit: 200 }).then((r: { data: unknown }) => r.data) });

  const orderMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => editing ? salesApi.updateSalesOrder(editing.id as string, data) : salesApi.createSalesOrder(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); qc.invalidateQueries({ queryKey: ['sales-stats'] }); setModalOpen(false); setEditing(null); setForm(EMPTY_ORDER); toast.success('Order saved'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteOrderMut = useMutation({
    mutationFn: salesApi.deleteSalesOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-orders'] }); qc.invalidateQueries({ queryKey: ['sales-stats'] }); toast.success('Order deleted'); },
  });
  const invMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => salesApi.createInvoice(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-invoices'] }); qc.invalidateQueries({ queryKey: ['sales-stats'] }); setInvModalOpen(false); setInvForm(EMPTY_INVOICE); toast.success('Invoice created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const payMut = useMutation({
    mutationFn: () => salesApi.recordPayment(selectedInv!.id as string, Number(payAmount)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales-invoices'] }); qc.invalidateQueries({ queryKey: ['sales-stats'] }); setPayModalOpen(false); setPayAmount(''); toast.success('Payment recorded'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const orders = orderData?.data || [];
  const invoices = invoiceData?.data || [];
  const orderMeta = orderData?.meta || { total: 0, totalPages: 1 };
  const invMeta = invoiceData?.meta || { total: 0, totalPages: 1 };
  const meta = tab === 'orders' ? orderMeta : invMeta;

  const addLine = () => setForm(f => ({ ...f, lines: [...(f.lines as Record<string, unknown>[]), { ...EMPTY_LINE }] }));
  const updateLine = (idx: number, field: string, value: string) => setForm(f => {
    const lines = [...(f.lines as Record<string, unknown>[])];
    lines[idx] = { ...lines[idx], [field]: value };
    return { ...f, lines };
  });
  const removeLine = (idx: number) => setForm(f => ({ ...f, lines: (f.lines as Record<string, unknown>[]).filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Sales</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage sales orders and invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats?.totalOrders ?? '-', icon: <ShoppingCart size={18} />, color: '#6366f1' },
          { label: 'Revenue (Month)', value: stats?.monthRevenue ? `$${Number(stats.monthRevenue).toLocaleString()}` : '-', icon: <TrendingUp size={18} />, color: '#10b981' },
          { label: 'Pending Invoices', value: stats?.pendingInvoices ?? '-', icon: <FileText size={18} />, color: '#f59e0b' },
          { label: 'Overdue Invoices', value: stats?.overdueInvoices ?? '-', icon: <DollarSign size={18} />, color: '#ef4444' },
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

      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        {(['orders', 'invoices'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(''); }} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{t}</button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={`Search ${tab}...`} className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          {tab === 'orders'
            ? <Button onClick={() => { setEditing(null); setForm(EMPTY_ORDER); setModalOpen(true); }} size="sm"><Plus size={14} className="mr-1" />New Order</Button>
            : <Button onClick={() => { setInvForm(EMPTY_INVOICE); setInvModalOpen(true); }} size="sm"><Plus size={14} className="mr-1" />New Invoice</Button>
          }
        </div>

        {(tab === 'orders' ? ordersLoading : invLoading) ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            {tab === 'orders' ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    {['Order #', 'Customer', 'Date', 'Status', 'Payment', 'Total', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord: Record<string, unknown>) => (
                    <tr key={ord.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="py-3 px-3 font-mono text-xs text-primary-600">{ord.orderNumber as string}</td>
                      <td className="py-3 px-3 text-surface-900 dark:text-surface-100">{(ord.customer as { customerName: string } | undefined)?.customerName || '-'}</td>
                      <td className="py-3 px-3 text-surface-500">{ord.orderDate as string}</td>
                      <td className="py-3 px-3"><Badge variant={STATUS_COLORS[ord.orderStatus as string] || 'default'}>{ord.orderStatus as string}</Badge></td>
                      <td className="py-3 px-3"><Badge variant={STATUS_COLORS[ord.paymentStatus as string] || 'default'}>{ord.paymentStatus as string}</Badge></td>
                      <td className="py-3 px-3 font-semibold text-surface-900 dark:text-surface-100">${Number(ord.totalAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditing(ord); setForm({ ...ord, lines: (ord.lines as Record<string, unknown>[]) || [] }); setModalOpen(true); }} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this order?')) deleteOrderMut.mutate(ord.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-surface-400">No orders found</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    {['Invoice #', 'Customer', 'Date', 'Due Date', 'Status', 'Total', 'Balance', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: Record<string, unknown>) => (
                    <tr key={inv.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="py-3 px-3 font-mono text-xs text-primary-600">{inv.invoiceNumber as string}</td>
                      <td className="py-3 px-3 text-surface-900 dark:text-surface-100">{(inv.customer as { customerName: string } | undefined)?.customerName || '-'}</td>
                      <td className="py-3 px-3 text-surface-500">{inv.invoiceDate as string}</td>
                      <td className="py-3 px-3 text-surface-500">{inv.dueDate as string || '-'}</td>
                      <td className="py-3 px-3"><Badge variant={STATUS_COLORS[inv.status as string] || 'default'}>{inv.status as string}</Badge></td>
                      <td className="py-3 px-3 font-semibold">${Number(inv.totalAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-red-600 font-medium">${Number(inv.balanceDue || 0).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        {Number(inv.balanceDue) > 0 && (
                          <button onClick={() => { setSelectedInv(inv); setPayAmount(''); setPayModalOpen(true); }} className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium">Record Payment</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-surface-400">No invoices found</td></tr>}
                </tbody>
              </table>
            )}
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

      {/* Sales Order Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Sales Order' : 'New Sales Order'} size="xl">
        <form onSubmit={e => { e.preventDefault(); orderMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Order Number *" value={(form.orderNumber as string) || ''} onChange={v => setForm(f => ({ ...f, orderNumber: v }))} required />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Customer *</label>
              <select value={(form.customerId as string) || ''} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select Customer</option>
                {(customers as Record<string, unknown>[]).map(c => <option key={c.id as string} value={c.id as string}>{c.customerName as string}</option>)}
              </select>
            </div>
            <Input label="Order Date" type="date" value={(form.orderDate as string) || ''} onChange={v => setForm(f => ({ ...f, orderDate: v }))} />
            <Input label="Expected Delivery" type="date" value={(form.expectedDelivery as string) || ''} onChange={v => setForm(f => ({ ...f, expectedDelivery: v }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Line Items</label>
              <button type="button" onClick={addLine} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Plus size={12} />Add Line</button>
            </div>
            <div className="space-y-2">
              {(form.lines as Record<string, unknown>[]).map((line, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                  <div className="col-span-2">
                    <input placeholder="Description" value={(line.itemDescription as string) || ''} onChange={e => updateLine(idx, 'itemDescription', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  </div>
                  <input placeholder="Qty" type="number" value={(line.quantity as string) || ''} onChange={e => updateLine(idx, 'quantity', e.target.value)} className="px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <input placeholder="Price" type="number" value={(line.unitPrice as string) || ''} onChange={e => updateLine(idx, 'unitPrice', e.target.value)} className="px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <input placeholder="Tax %" type="number" value={(line.taxPercent as string) || ''} onChange={e => updateLine(idx, 'taxPercent', e.target.value)} className="px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ))}
              {(form.lines as Record<string, unknown>[]).length === 0 && <p className="text-xs text-surface-400 italic">No line items added</p>}
            </div>
          </div>

          <Input label="Notes" value={(form.notes as string) || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={orderMut.isPending}>{editing ? 'Update' : 'Create'} Order</Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={invModalOpen} onClose={() => setInvModalOpen(false)} title="Create Invoice" size="lg">
        <form onSubmit={e => { e.preventDefault(); invMut.mutate({ ...invForm, invoiceType: 'sales' }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number *" value={(invForm.invoiceNumber as string) || ''} onChange={v => setInvForm(f => ({ ...f, invoiceNumber: v }))} required />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Customer *</label>
              <select value={(invForm.customerId as string) || ''} onChange={e => setInvForm(f => ({ ...f, customerId: e.target.value }))} required className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select Customer</option>
                {(customers as Record<string, unknown>[]).map(c => <option key={c.id as string} value={c.id as string}>{c.customerName as string}</option>)}
              </select>
            </div>
            <Input label="Invoice Date" type="date" value={(invForm.invoiceDate as string) || ''} onChange={v => setInvForm(f => ({ ...f, invoiceDate: v }))} />
            <Input label="Due Date" type="date" value={(invForm.dueDate as string) || ''} onChange={v => setInvForm(f => ({ ...f, dueDate: v }))} />
            <Input label="Subtotal" type="number" value={(invForm.subtotal as string) || ''} onChange={v => setInvForm(f => ({ ...f, subtotal: v }))} />
            <Input label="Tax Amount" type="number" value={(invForm.taxAmount as string) || ''} onChange={v => setInvForm(f => ({ ...f, taxAmount: v }))} />
            <Input label="Total Amount *" type="number" value={(invForm.totalAmount as string) || ''} onChange={v => setInvForm(f => ({ ...f, totalAmount: v }))} required />
            <Input label="Notes" value={(invForm.notes as string) || ''} onChange={v => setInvForm(f => ({ ...f, notes: v }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setInvModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={invMut.isPending}>Create Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title={`Record Payment — ${selectedInv?.invoiceNumber as string || ''}`}>
        <form onSubmit={e => { e.preventDefault(); payMut.mutate(); }} className="space-y-4">
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-sm">
            <div className="flex justify-between"><span className="text-surface-500">Total:</span><span className="font-medium">${Number(selectedInv?.totalAmount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between mt-1"><span className="text-surface-500">Paid:</span><span className="font-medium">${Number(selectedInv?.paidAmount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between mt-1 text-red-600"><span>Balance Due:</span><span className="font-semibold">${Number(selectedInv?.balanceDue || 0).toLocaleString()}</span></div>
          </div>
          <Input label="Payment Amount *" type="number" value={payAmount} onChange={setPayAmount} required />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setPayModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={payMut.isPending}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;
