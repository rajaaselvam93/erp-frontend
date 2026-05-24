import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Warehouse, Plus, Search, Edit2, Trash2, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { inventoryApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EMPTY_ITEM = { sku: '', itemName: '', category: '', unitOfMeasure: 'pcs', unitPrice: '', costPrice: '', reorderLevel: '', reorderQuantity: '', warehouseId: '', isTracked: true };
const EMPTY_TXN = { transactionType: 'receipt', quantity: '', unitCost: '', notes: '' };

const Inventory: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'items' | 'warehouses'>('items');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_ITEM);
  const [txnForm, setTxnForm] = useState<Record<string, unknown>>(EMPTY_TXN);

  const { data: stats } = useQuery({ queryKey: ['inv-stats'], queryFn: inventoryApi.getStats });
  const { data: itemData, isLoading } = useQuery({
    queryKey: ['inv-items', page, search],
    queryFn: () => inventoryApi.getItems({ page, limit: 20, search }),
    enabled: tab === 'items',
  });
  const { data: warehouses = [] } = useQuery({ queryKey: ['inv-warehouses'], queryFn: inventoryApi.getWarehouses });

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => editing ? inventoryApi.updateItem(editing.id as string, data) : inventoryApi.createItem(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['inv-stats'] }); setModalOpen(false); setEditing(null); setForm(EMPTY_ITEM); toast.success(editing ? 'Item updated' : 'Item created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: inventoryApi.deleteItem,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['inv-stats'] }); toast.success('Item deleted'); },
  });
  const txnMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryApi.addTransaction(selectedItem!.id as string, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv-items'] }); qc.invalidateQueries({ queryKey: ['inv-stats'] }); setTxnModalOpen(false); setTxnForm(EMPTY_TXN); toast.success('Transaction recorded'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const items = itemData?.data || [];
  const meta = itemData?.meta || { total: 0, totalPages: 1 };

  const stockStatus = (item: Record<string, unknown>) => {
    const stock = item.currentStock as number;
    const reorder = item.reorderLevel as number;
    if (stock <= 0) return <Badge variant="error">Out of Stock</Badge>;
    if (stock <= reorder) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Inventory Management</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Track stock levels, warehouses and transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: stats?.totalItems ?? '-', icon: <Package size={18} />, color: '#6366f1' },
          { label: 'Low Stock', value: stats?.lowStockItems ?? '-', icon: <AlertTriangle size={18} />, color: '#f59e0b' },
          { label: 'Out of Stock', value: stats?.outOfStockItems ?? '-', icon: <AlertTriangle size={18} />, color: '#ef4444' },
          { label: 'Warehouses', value: stats?.warehouses ?? '-', icon: <Warehouse size={18} />, color: '#8b5cf6' },
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
        {(['items', 'warehouses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'items' && (
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search items..." className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <Button onClick={() => { setEditing(null); setForm(EMPTY_ITEM); setModalOpen(true); }} size="sm"><Plus size={14} className="mr-1" />Add Item</Button>
          </div>

          {isLoading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    {['SKU', 'Item Name', 'Category', 'UOM', 'Stock', 'Reorder Level', 'Unit Price', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: Record<string, unknown>) => (
                    <tr key={item.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="py-3 px-3 font-mono text-xs text-primary-600">{item.sku as string}</td>
                      <td className="py-3 px-3 font-medium text-surface-900 dark:text-surface-100">{item.itemName as string}</td>
                      <td className="py-3 px-3 text-surface-500">{item.category as string || '-'}</td>
                      <td className="py-3 px-3 text-surface-500">{item.unitOfMeasure as string}</td>
                      <td className="py-3 px-3 font-semibold text-surface-900 dark:text-surface-100">{item.currentStock as number}</td>
                      <td className="py-3 px-3 text-surface-500">{item.reorderLevel as number}</td>
                      <td className="py-3 px-3 text-surface-600">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-3 px-3">{stockStatus(item)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedItem(item); setTxnModalOpen(true); }} title="Add Transaction" className="p-1.5 text-surface-400 hover:text-green-600 hover:bg-green-50 rounded-lg"><ArrowUpDown size={14} /></button>
                          <button onClick={() => { setEditing(item); setForm({ ...item }); setModalOpen(true); }} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this item?')) deleteMut.mutate(item.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-surface-400">No items found</td></tr>}
                </tbody>
              </table>
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
      )}

      {tab === 'warehouses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(warehouses as Record<string, unknown>[]).map(wh => (
            <Card key={wh.id as string}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0"><Warehouse size={18} className="text-indigo-600" /></div>
                <div>
                  <p className="font-medium text-surface-900 dark:text-surface-100">{wh.warehouseName as string}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{wh.warehouseCode as string}</p>
                  <p className="text-xs text-surface-500 mt-1">{[wh.city, wh.country].filter(Boolean).join(', ') || wh.location as string || '-'}</p>
                  <Badge variant={wh.isActive ? 'success' : 'error'} className="mt-2">{wh.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </Card>
          ))}
          {(warehouses as Record<string, unknown>[]).length === 0 && <p className="col-span-3 text-center py-8 text-surface-400">No warehouses</p>}
        </div>
      )}

      {/* Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Item'} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU *" value={(form.sku as string) || ''} onChange={v => setForm(f => ({ ...f, sku: v }))} required />
            <Input label="Item Name *" value={(form.itemName as string) || ''} onChange={v => setForm(f => ({ ...f, itemName: v }))} required />
            <Input label="Category" value={(form.category as string) || ''} onChange={v => setForm(f => ({ ...f, category: v }))} />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Unit of Measure</label>
              <select value={(form.unitOfMeasure as string) || 'pcs'} onChange={e => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {['pcs', 'kg', 'ltr', 'm', 'box', 'set', 'unit'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <Input label="Unit Price" type="number" value={(form.unitPrice as string) || ''} onChange={v => setForm(f => ({ ...f, unitPrice: v }))} />
            <Input label="Cost Price" type="number" value={(form.costPrice as string) || ''} onChange={v => setForm(f => ({ ...f, costPrice: v }))} />
            <Input label="Reorder Level" type="number" value={(form.reorderLevel as string) || ''} onChange={v => setForm(f => ({ ...f, reorderLevel: v }))} />
            <Input label="Reorder Quantity" type="number" value={(form.reorderQuantity as string) || ''} onChange={v => setForm(f => ({ ...f, reorderQuantity: v }))} />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Warehouse</label>
              <select value={(form.warehouseId as string) || ''} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select Warehouse</option>
                {(warehouses as Record<string, unknown>[]).map(w => <option key={w.id as string} value={w.id as string}>{w.warehouseName as string}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={saveMut.isPending}>{editing ? 'Update' : 'Create'} Item</Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={txnModalOpen} onClose={() => setTxnModalOpen(false)} title={`Add Transaction — ${selectedItem?.itemName as string || ''}`}>
        <form onSubmit={e => { e.preventDefault(); txnMut.mutate(txnForm); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Transaction Type *</label>
            <select value={(txnForm.transactionType as string) || 'receipt'} onChange={e => setTxnForm(f => ({ ...f, transactionType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
              {['receipt', 'issue', 'transfer', 'adjustment', 'return'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input label="Quantity *" type="number" value={(txnForm.quantity as string) || ''} onChange={v => setTxnForm(f => ({ ...f, quantity: v }))} required />
          <Input label="Unit Cost" type="number" value={(txnForm.unitCost as string) || ''} onChange={v => setTxnForm(f => ({ ...f, unitCost: v }))} />
          <Input label="Notes" value={(txnForm.notes as string) || ''} onChange={v => setTxnForm(f => ({ ...f, notes: v }))} />
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setTxnModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={txnMut.isPending}>Record Transaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
