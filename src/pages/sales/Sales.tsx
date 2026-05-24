import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, FileText, Plus, Edit2, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { salesApi, crmApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, TabBar, Toolbar, Table, TR, TD, MonoCell,
  EmptyRow, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  draft: 'default', confirmed: 'warning', processing: 'warning', shipped: 'warning',
  delivered: 'success', cancelled: 'error', returned: 'error',
  unpaid: 'error', partial: 'warning', paid: 'success', overdue: 'error', sent: 'warning',
};

const EMPTY_ORDER = {
  orderNumber: '', customerId: '', orderDate: new Date().toISOString().split('T')[0],
  expectedDelivery: '', notes: '', lines: [] as Record<string, unknown>[],
};
const EMPTY_INVOICE = {
  invoiceNumber: '', customerId: '', salesOrderId: '',
  invoiceDate: new Date().toISOString().split('T')[0], dueDate: '',
  subtotal: '', taxAmount: '', totalAmount: '', notes: '',
};
const EMPTY_LINE = { itemDescription: '', quantity: '1', unitPrice: '', discountPercent: '0', taxPercent: '0' };

const TABS = ['orders', 'invoices'] as const;

const lineInputCls = 'px-2 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/60 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all';

const Sales: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>('orders');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [selectedInv, setSelectedInv] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_ORDER);
  const [invForm, setInvForm] = useState<Record<string, unknown>>(EMPTY_INVOICE);
  const [payAmount, setPayAmount] = useState('');

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
  const { data: customers = [] } = useQuery({
    queryKey: ['crm-customers-all'],
    queryFn: () => crmApi.getCustomers({ limit: 200 }).then((r: { data: unknown }) => r.data),
  });

  const orderMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editing ? salesApi.updateSalesOrder(editing.id as string, data) : salesApi.createSalesOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['sales-stats'] });
      setModalOpen(false); setEditing(null); setForm(EMPTY_ORDER);
      toast.success('Order saved');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteOrderMut = useMutation({
    mutationFn: salesApi.deleteSalesOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      qc.invalidateQueries({ queryKey: ['sales-stats'] });
      toast.success('Order deleted');
    },
  });
  const invMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => salesApi.createInvoice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
      qc.invalidateQueries({ queryKey: ['sales-stats'] });
      setInvModalOpen(false); setInvForm(EMPTY_INVOICE);
      toast.success('Invoice created');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const payMut = useMutation({
    mutationFn: () => salesApi.recordPayment(selectedInv!.id as string, Number(payAmount)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-invoices'] });
      qc.invalidateQueries({ queryKey: ['sales-stats'] });
      setPayModalOpen(false); setPayAmount('');
      toast.success('Payment recorded');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const orders = orderData?.data || [];
  const invoices = invoiceData?.data || [];
  const meta = (tab === 'orders' ? orderData?.meta : invoiceData?.meta) || { total: 0, totalPages: 1 };

  const addLine = () => setForm(f => ({ ...f, lines: [...(f.lines as Record<string, unknown>[]), { ...EMPTY_LINE }] }));
  const updateLine = (idx: number, field: string, value: string) => setForm(f => {
    const lines = [...(f.lines as Record<string, unknown>[])];
    lines[idx] = { ...lines[idx], [field]: value };
    return { ...f, lines };
  });
  const removeLine = (idx: number) => setForm(f => ({ ...f, lines: (f.lines as Record<string, unknown>[]).filter((_, i) => i !== idx) }));

  const fi = (k: string) => (invForm[k] as string) || '';
  const sfi = (k: string) => (v: string) => setInvForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" subtitle="Manage sales orders and invoices" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"     value={stats?.totalOrders ?? '-'}                                                                        icon={<ShoppingCart size={15} />} gradient="from-primary-500 to-primary-700" />
        <StatCard label="Revenue (Month)"  value={stats?.monthRevenue ? `$${Number(stats.monthRevenue).toLocaleString()}` : '-'}                    icon={<TrendingUp size={15} />}   gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Pending Invoices" value={stats?.pendingInvoices ?? '-'}                                                                     icon={<FileText size={15} />}     gradient="from-amber-500 to-orange-600" />
        <StatCard label="Overdue Invoices" value={stats?.overdueInvoices ?? '-'}                                                                     icon={<DollarSign size={15} />}   gradient="from-red-500 to-rose-600" />
      </div>

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={t => { setTab(t as typeof TABS[number]); setPage(1); setSearch(''); }}
        labels={{ orders: 'Sales Orders', invoices: 'Invoices' }}
      />

      <Card>
        <Toolbar
          search={search}
          onSearch={v => { setSearch(v); setPage(1); }}
          placeholder={`Search ${tab}…`}
          onAdd={tab === 'orders'
            ? () => { setEditing(null); setForm(EMPTY_ORDER); setModalOpen(true); }
            : () => { setInvForm(EMPTY_INVOICE); setInvModalOpen(true); }
          }
          addLabel={tab === 'orders' ? 'New Order' : 'New Invoice'}
        />

        {(tab === 'orders' ? ordersLoading : invLoading) ? <LoadingSpinner /> : tab === 'orders' ? (
          <Table headers={['Order #', 'Customer', 'Date', 'Status', 'Payment', 'Total', 'Actions']}>
            {orders.map((ord: Record<string, unknown>) => (
              <TR key={ord.id as string}>
                <MonoCell>{ord.orderNumber as string}</MonoCell>
                <TD className="text-sm text-surface-900 dark:text-surface-100">
                  {(ord.customer as { customerName: string } | undefined)?.customerName || '—'}
                </TD>
                <TD className="text-surface-500 text-xs">{ord.orderDate as string}</TD>
                <TD><Badge variant={STATUS_COLORS[ord.orderStatus as string] || 'default'}>{ord.orderStatus as string}</Badge></TD>
                <TD><Badge variant={STATUS_COLORS[ord.paymentStatus as string] || 'default'}>{ord.paymentStatus as string}</Badge></TD>
                <TD className="font-semibold text-sm text-surface-800 dark:text-surface-200">
                  ${Number(ord.totalAmount || 0).toLocaleString()}
                </TD>
                <TD>
                  <div className="flex gap-1">
                    <ActionBtn color="primary" onClick={() => { setEditing(ord); setForm({ ...ord, lines: (ord.lines as Record<string, unknown>[]) || [] }); setModalOpen(true); }} title="Edit">
                      <Edit2 size={13} />
                    </ActionBtn>
                    <ActionBtn color="danger" onClick={() => { if (confirm('Delete this order?')) deleteOrderMut.mutate(ord.id as string); }} title="Delete">
                      <Trash2 size={13} />
                    </ActionBtn>
                  </div>
                </TD>
              </TR>
            ))}
            {orders.length === 0 && <EmptyRow colSpan={7} message="No orders found" />}
          </Table>
        ) : (
          <Table headers={['Invoice #', 'Customer', 'Date', 'Due Date', 'Status', 'Total', 'Balance', 'Actions']}>
            {invoices.map((inv: Record<string, unknown>) => (
              <TR key={inv.id as string}>
                <MonoCell>{inv.invoiceNumber as string}</MonoCell>
                <TD className="text-sm text-surface-900 dark:text-surface-100">
                  {(inv.customer as { customerName: string } | undefined)?.customerName || '—'}
                </TD>
                <TD className="text-surface-500 text-xs">{inv.invoiceDate as string}</TD>
                <TD className="text-surface-500 text-xs">{(inv.dueDate as string) || '—'}</TD>
                <TD><Badge variant={STATUS_COLORS[inv.status as string] || 'default'}>{inv.status as string}</Badge></TD>
                <TD className="font-semibold text-sm text-surface-800 dark:text-surface-200">
                  ${Number(inv.totalAmount || 0).toLocaleString()}
                </TD>
                <TD className="font-semibold text-sm text-red-600 dark:text-red-400">
                  ${Number(inv.balanceDue || 0).toLocaleString()}
                </TD>
                <TD>
                  {Number(inv.balanceDue) > 0 && (
                    <button
                      onClick={() => { setSelectedInv(inv); setPayAmount(''); setPayModalOpen(true); }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                    >
                      Record Payment
                    </button>
                  )}
                </TD>
              </TR>
            ))}
            {invoices.length === 0 && <EmptyRow colSpan={8} message="No invoices found" />}
          </Table>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      </Card>

      {/* Sales Order Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Sales Order' : 'New Sales Order'} size="xl">
        <form onSubmit={e => { e.preventDefault(); orderMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Order Number *" value={(form.orderNumber as string) || ''} onChange={v => setForm(f => ({ ...f, orderNumber: v }))} required />
            <FieldSelect label="Customer *" value={(form.customerId as string) || ''} onChange={v => setForm(f => ({ ...f, customerId: v }))} required>
              <option value="">Select Customer</option>
              {(customers as Record<string, unknown>[]).map(c => (
                <option key={c.id as string} value={c.id as string}>{c.customerName as string}</option>
              ))}
            </FieldSelect>
            <Input label="Order Date" type="date" value={(form.orderDate as string) || ''} onChange={v => setForm(f => ({ ...f, orderDate: v }))} />
            <Input label="Expected Delivery" type="date" value={(form.expectedDelivery as string) || ''} onChange={v => setForm(f => ({ ...f, expectedDelivery: v }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Line Items</label>
              <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                <Plus size={12} /> Add Line
              </button>
            </div>
            <div className="space-y-2">
              {(form.lines as Record<string, unknown>[]).map((line, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                  <div className="col-span-2">
                    <input placeholder="Description" value={(line.itemDescription as string) || ''} onChange={e => updateLine(idx, 'itemDescription', e.target.value)} className={`w-full ${lineInputCls}`} />
                  </div>
                  <input placeholder="Qty" type="number" value={(line.quantity as string) || ''} onChange={e => updateLine(idx, 'quantity', e.target.value)} className={lineInputCls} />
                  <input placeholder="Price" type="number" value={(line.unitPrice as string) || ''} onChange={e => updateLine(idx, 'unitPrice', e.target.value)} className={lineInputCls} />
                  <input placeholder="Tax %" type="number" value={(line.taxPercent as string) || ''} onChange={e => updateLine(idx, 'taxPercent', e.target.value)} className={lineInputCls} />
                  <button type="button" onClick={() => removeLine(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </div>
              ))}
              {(form.lines as Record<string, unknown>[]).length === 0 && (
                <p className="text-xs text-surface-400 italic">No line items added</p>
              )}
            </div>
          </div>

          <Input label="Notes" value={(form.notes as string) || ''} onChange={v => setForm(f => ({ ...f, notes: v }))} />
          <FormFooter onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update Order' : 'Create Order'} loading={orderMut.isPending} />
        </form>
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={invModalOpen} onClose={() => setInvModalOpen(false)} title="Create Invoice" size="lg">
        <form onSubmit={e => { e.preventDefault(); invMut.mutate({ ...invForm, invoiceType: 'sales' }); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Invoice Number *" value={fi('invoiceNumber')} onChange={sfi('invoiceNumber')} required />
            <FieldSelect label="Customer *" value={fi('customerId')} onChange={sfi('customerId')} required>
              <option value="">Select Customer</option>
              {(customers as Record<string, unknown>[]).map(c => (
                <option key={c.id as string} value={c.id as string}>{c.customerName as string}</option>
              ))}
            </FieldSelect>
            <Input label="Invoice Date" type="date" value={fi('invoiceDate')} onChange={sfi('invoiceDate')} />
            <Input label="Due Date" type="date" value={fi('dueDate')} onChange={sfi('dueDate')} />
            <Input label="Subtotal" type="number" value={fi('subtotal')} onChange={sfi('subtotal')} />
            <Input label="Tax Amount" type="number" value={fi('taxAmount')} onChange={sfi('taxAmount')} />
            <Input label="Total Amount *" type="number" value={fi('totalAmount')} onChange={sfi('totalAmount')} required />
            <Input label="Notes" value={fi('notes')} onChange={sfi('notes')} />
          </div>
          <FormFooter onCancel={() => setInvModalOpen(false)} submitLabel="Create Invoice" loading={invMut.isPending} />
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title={`Record Payment — ${(selectedInv?.invoiceNumber as string) || ''}`}>
        <form onSubmit={e => { e.preventDefault(); payMut.mutate(); }} className="space-y-4">
          <div className="bg-surface-50 dark:bg-surface-800/60 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Total</span>
              <span className="font-medium text-surface-800 dark:text-surface-200">${Number(selectedInv?.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Paid</span>
              <span className="font-medium text-surface-800 dark:text-surface-200">${Number(selectedInv?.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-surface-200 dark:border-surface-700">
              <span className="text-red-600 dark:text-red-400 font-medium">Balance Due</span>
              <span className="font-bold text-red-600 dark:text-red-400">${Number(selectedInv?.balanceDue || 0).toLocaleString()}</span>
            </div>
          </div>
          <Input label="Payment Amount *" type="number" value={payAmount} onChange={setPayAmount} required />
          <FormFooter onCancel={() => setPayModalOpen(false)} submitLabel="Record Payment" loading={payMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default Sales;
