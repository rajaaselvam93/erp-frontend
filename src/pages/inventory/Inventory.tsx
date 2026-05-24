import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Warehouse, Edit2, Trash2, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { inventoryApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, TabBar, Toolbar, Table, TR, TD, MonoCell,
  EmptyRow, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const EMPTY_ITEM = {
  sku: '', itemName: '', category: '', unitOfMeasure: 'pcs',
  unitPrice: '', costPrice: '', reorderLevel: '', reorderQuantity: '', warehouseId: '', isTracked: true,
};
const EMPTY_TXN = { transactionType: 'receipt', quantity: '', unitCost: '', notes: '' };

const TABS = ['items', 'warehouses'] as const;

const stockStatus = (item: Record<string, unknown>) => {
  const stock = item.currentStock as number;
  const reorder = item.reorderLevel as number;
  if (stock <= 0) return <Badge variant="error">Out of Stock</Badge>;
  if (stock <= reorder) return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="success">In Stock</Badge>;
};

const Inventory: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>('items');
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
    mutationFn: (data: Record<string, unknown>) =>
      editing ? inventoryApi.updateItem(editing.id as string, data) : inventoryApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-items'] });
      qc.invalidateQueries({ queryKey: ['inv-stats'] });
      setModalOpen(false); setEditing(null); setForm(EMPTY_ITEM);
      toast.success(editing ? 'Item updated' : 'Item created');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteMut = useMutation({
    mutationFn: inventoryApi.deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-items'] });
      qc.invalidateQueries({ queryKey: ['inv-stats'] });
      toast.success('Item deleted');
    },
  });
  const txnMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => inventoryApi.addTransaction(selectedItem!.id as string, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-items'] });
      qc.invalidateQueries({ queryKey: ['inv-stats'] });
      setTxnModalOpen(false); setTxnForm(EMPTY_TXN);
      toast.success('Transaction recorded');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const items = itemData?.data || [];
  const meta = itemData?.meta || { total: 0, totalPages: 1 };
  const f = (k: string) => (form[k] as string) || '';
  const sf = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const tf = (k: string) => (txnForm[k] as string) || '';
  const stf = (k: string) => (v: string) => setTxnForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Management" subtitle="Track stock levels, warehouses and transactions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items"   value={stats?.totalItems ?? '-'}       icon={<Package size={15} />}       gradient="from-primary-500 to-primary-700" />
        <StatCard label="Low Stock"     value={stats?.lowStockItems ?? '-'}    icon={<AlertTriangle size={15} />} gradient="from-amber-500 to-orange-600" />
        <StatCard label="Out of Stock"  value={stats?.outOfStockItems ?? '-'}  icon={<AlertTriangle size={15} />} gradient="from-red-500 to-rose-600" />
        <StatCard label="Warehouses"    value={stats?.warehouses ?? '-'}       icon={<Warehouse size={15} />}     gradient="from-violet-500 to-purple-700" />
      </div>

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={t => { setTab(t as typeof TABS[number]); setPage(1); setSearch(''); }}
      />

      {tab === 'items' && (
        <Card>
          <Toolbar
            search={search}
            onSearch={v => { setSearch(v); setPage(1); }}
            placeholder="Search items…"
            onAdd={() => { setEditing(null); setForm(EMPTY_ITEM); setModalOpen(true); }}
            addLabel="Add Item"
          />

          {isLoading ? <LoadingSpinner /> : (
            <>
              <Table headers={['SKU', 'Item Name', 'Category', 'UOM', 'Stock', 'Reorder', 'Unit Price', 'Status', 'Actions']}>
                {items.map((item: Record<string, unknown>) => (
                  <TR key={item.id as string}>
                    <MonoCell>{item.sku as string}</MonoCell>
                    <TD className="font-semibold text-sm text-surface-900 dark:text-surface-100">{item.itemName as string}</TD>
                    <TD className="text-surface-500 text-xs">{(item.category as string) || '—'}</TD>
                    <TD className="text-surface-500 text-xs">{item.unitOfMeasure as string}</TD>
                    <TD className="font-semibold text-sm text-surface-800 dark:text-surface-200">{item.currentStock as number}</TD>
                    <TD className="text-surface-400 text-xs">{item.reorderLevel as number}</TD>
                    <TD className="text-surface-600 dark:text-surface-300 text-xs">${Number(item.unitPrice).toFixed(2)}</TD>
                    <TD>{stockStatus(item)}</TD>
                    <TD>
                      <div className="flex items-center gap-1">
                        <ActionBtn color="success" onClick={() => { setSelectedItem(item); setTxnModalOpen(true); }} title="Add Transaction">
                          <ArrowUpDown size={13} />
                        </ActionBtn>
                        <ActionBtn color="primary" onClick={() => { setEditing(item); setForm({ ...item }); setModalOpen(true); }} title="Edit">
                          <Edit2 size={13} />
                        </ActionBtn>
                        <ActionBtn color="danger" onClick={() => { if (confirm('Delete this item?')) deleteMut.mutate(item.id as string); }} title="Delete">
                          <Trash2 size={13} />
                        </ActionBtn>
                      </div>
                    </TD>
                  </TR>
                ))}
                {items.length === 0 && <EmptyRow colSpan={9} message="No items found" />}
              </Table>
              <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
            </>
          )}
        </Card>
      )}

      {tab === 'warehouses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(warehouses as Record<string, unknown>[]).map(wh => (
            <Card key={wh.id as string} hover>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shrink-0">
                  <Warehouse size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-surface-900 dark:text-surface-100">{wh.warehouseName as string}</p>
                  <p className="text-[11px] text-surface-400 mt-0.5">{wh.warehouseCode as string}</p>
                  <p className="text-[11px] text-surface-500 mt-1">
                    {[wh.city, wh.country].filter(Boolean).join(', ') || (wh.location as string) || '—'}
                  </p>
                  <div className="mt-2">
                    <Badge variant={(wh.isActive as boolean) ? 'success' : 'error'} dot>
                      {(wh.isActive as boolean) ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {(warehouses as Record<string, unknown>[]).length === 0 && (
            <p className="col-span-3 text-center py-12 text-sm text-surface-400">No warehouses found</p>
          )}
        </div>
      )}

      {/* Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Item'} size="lg">
        <form onSubmit={e => { e.preventDefault(); saveMut.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU *" value={f('sku')} onChange={sf('sku')} required />
            <Input label="Item Name *" value={f('itemName')} onChange={sf('itemName')} required />
            <Input label="Category" value={f('category')} onChange={sf('category')} />
            <FieldSelect label="Unit of Measure" value={f('unitOfMeasure') || 'pcs'} onChange={sf('unitOfMeasure')}>
              {['pcs', 'kg', 'ltr', 'm', 'box', 'set', 'unit'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </FieldSelect>
            <Input label="Unit Price" type="number" value={f('unitPrice')} onChange={sf('unitPrice')} />
            <Input label="Cost Price" type="number" value={f('costPrice')} onChange={sf('costPrice')} />
            <Input label="Reorder Level" type="number" value={f('reorderLevel')} onChange={sf('reorderLevel')} />
            <Input label="Reorder Quantity" type="number" value={f('reorderQuantity')} onChange={sf('reorderQuantity')} />
            <FieldSelect label="Warehouse" value={f('warehouseId')} onChange={sf('warehouseId')}>
              <option value="">Select Warehouse</option>
              {(warehouses as Record<string, unknown>[]).map(w => (
                <option key={w.id as string} value={w.id as string}>{w.warehouseName as string}</option>
              ))}
            </FieldSelect>
          </div>
          <FormFooter onCancel={() => setModalOpen(false)} submitLabel={editing ? 'Update Item' : 'Create Item'} loading={saveMut.isPending} />
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={txnModalOpen} onClose={() => setTxnModalOpen(false)} title={`Add Transaction — ${(selectedItem?.itemName as string) || ''}`}>
        <form onSubmit={e => { e.preventDefault(); txnMut.mutate(txnForm); }} className="space-y-4">
          <FieldSelect label="Transaction Type *" value={tf('transactionType') || 'receipt'} onChange={stf('transactionType')} required>
            {['receipt', 'issue', 'transfer', 'adjustment', 'return'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </FieldSelect>
          <Input label="Quantity *" type="number" value={tf('quantity')} onChange={stf('quantity')} required />
          <Input label="Unit Cost" type="number" value={tf('unitCost')} onChange={stf('unitCost')} />
          <Input label="Notes" value={tf('notes')} onChange={stf('notes')} />
          <FormFooter onCancel={() => setTxnModalOpen(false)} submitLabel="Record Transaction" loading={txnMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
