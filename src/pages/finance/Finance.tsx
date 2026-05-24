import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BarChart2, Plus, Search, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { financeApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];
const EMPTY_ACCOUNT = { accountCode: '', accountName: '', accountType: 'asset', description: '', parentId: '' };
const EMPTY_ENTRY = { entryNumber: '', description: '', postingDate: new Date().toISOString().split('T')[0], fiscalYear: new Date().getFullYear().toString(), lines: [] as Record<string, unknown>[] };
const EMPTY_JE_LINE = { accountId: '', description: '', debitAmount: '', creditAmount: '' };

const Finance: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'accounts' | 'journal'>('accounts');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [acctModalOpen, setAcctModalOpen] = useState(false);
  const [jeModalOpen, setJeModalOpen] = useState(false);
  const [editingAcct, setEditingAcct] = useState<Record<string, unknown> | null>(null);
  const [acctForm, setAcctForm] = useState<Record<string, unknown>>(EMPTY_ACCOUNT);
  const [jeForm, setJeForm] = useState<Record<string, unknown>>(EMPTY_ENTRY);

  const { data: stats } = useQuery({ queryKey: ['finance-stats'], queryFn: financeApi.getStats });
  const { data: accounts = [], isLoading: acctLoading } = useQuery({
    queryKey: ['finance-accounts', search],
    queryFn: () => financeApi.getAccounts({ search }),
    enabled: tab === 'accounts',
  });
  const { data: jeData, isLoading: jeLoading } = useQuery({
    queryKey: ['finance-je', page, search],
    queryFn: () => financeApi.getJournalEntries({ page, limit: 20, search }),
    enabled: tab === 'journal',
  });

  const acctMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => editingAcct ? financeApi.updateAccount(editingAcct.id as string, data) : financeApi.createAccount(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-accounts'] }); setAcctModalOpen(false); setEditingAcct(null); setAcctForm(EMPTY_ACCOUNT); toast.success('Account saved'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteAcctMut = useMutation({
    mutationFn: financeApi.deleteAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-accounts'] }); toast.success('Account deleted'); },
  });
  const jeMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => financeApi.createJournalEntry(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-je'] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); setJeModalOpen(false); setJeForm(EMPTY_ENTRY); toast.success('Journal entry created'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const postMut = useMutation({
    mutationFn: financeApi.postJournalEntry,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-je'] }); toast.success('Journal entry posted'); },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });

  const entries = jeData?.data || [];
  const meta = jeData?.meta || { total: 0, totalPages: 1 };

  const addJeLine = () => setJeForm(f => ({ ...f, lines: [...(f.lines as Record<string, unknown>[]), { ...EMPTY_JE_LINE }] }));
  const updateJeLine = (idx: number, field: string, value: string) => setJeForm(f => {
    const lines = [...(f.lines as Record<string, unknown>[])];
    lines[idx] = { ...lines[idx], [field]: value };
    return { ...f, lines };
  });
  const removeJeLine = (idx: number) => setJeForm(f => ({ ...f, lines: (f.lines as Record<string, unknown>[]).filter((_, i) => i !== idx) }));

  const jeTotals = (jeForm.lines as Record<string, unknown>[]).reduce((acc, l) => ({
    debit: acc.debit + (Number(l.debitAmount) || 0),
    credit: acc.credit + (Number(l.creditAmount) || 0),
  }), { debit: 0, credit: 0 });

  const acctTypeColor: Record<string, string> = { asset: '#10b981', liability: '#ef4444', equity: '#8b5cf6', revenue: '#6366f1', expense: '#f59e0b' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Finance & Accounting</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Chart of accounts, journal entries and financial reports</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: stats?.totalRevenue ? `$${Number(stats.totalRevenue).toLocaleString()}` : '-', icon: <BarChart2 size={18} />, color: '#10b981' },
          { label: 'Total Expenses', value: stats?.totalExpenses ? `$${Number(stats.totalExpenses).toLocaleString()}` : '-', icon: <BarChart2 size={18} />, color: '#ef4444' },
          { label: 'Net Income', value: stats?.netIncome ? `$${Number(stats.netIncome).toLocaleString()}` : '-', icon: <BarChart2 size={18} />, color: '#6366f1' },
          { label: 'Accounts', value: stats?.accounts ?? '-', icon: <BookOpen size={18} />, color: '#8b5cf6' },
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
        {[{ key: 'accounts', label: 'Chart of Accounts' }, { key: 'journal', label: 'Journal Entries' }].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key as 'accounts' | 'journal'); setPage(1); setSearch(''); }} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'accounts' && (
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <Button onClick={() => { setEditingAcct(null); setAcctForm(EMPTY_ACCOUNT); setAcctModalOpen(true); }} size="sm"><Plus size={14} className="mr-1" />Add Account</Button>
          </div>

          {acctLoading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    {['Code', 'Account Name', 'Type', 'Balance', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(accounts as Record<string, unknown>[]).map(acc => (
                    <tr key={acc.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="py-3 px-3 font-mono text-xs text-primary-600">{acc.accountCode as string}</td>
                      <td className="py-3 px-3 font-medium text-surface-900 dark:text-surface-100">{acc.accountName as string}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white capitalize" style={{ backgroundColor: acctTypeColor[acc.accountType as string] || '#6b7280' }}>{acc.accountType as string}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-surface-900 dark:text-surface-100">${Number(acc.balance || 0).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditingAcct(acc); setAcctForm({ ...acc }); setAcctModalOpen(true); }} className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this account?')) deleteAcctMut.mutate(acc.id as string); }} className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(accounts as Record<string, unknown>[]).length === 0 && <tr><td colSpan={5} className="py-12 text-center text-surface-400">No accounts found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'journal' && (
        <Card>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search journal entries..." className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <Button onClick={() => { setJeForm(EMPTY_ENTRY); setJeModalOpen(true); }} size="sm"><Plus size={14} className="mr-1" />New Entry</Button>
          </div>

          {jeLoading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    {['Entry #', 'Description', 'Date', 'Debit', 'Credit', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((je: Record<string, unknown>) => (
                    <tr key={je.id as string} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="py-3 px-3 font-mono text-xs text-primary-600">{je.entryNumber as string}</td>
                      <td className="py-3 px-3 text-surface-900 dark:text-surface-100 max-w-xs truncate">{je.description as string}</td>
                      <td className="py-3 px-3 text-surface-500">{je.postingDate as string}</td>
                      <td className="py-3 px-3 font-semibold text-green-600">${Number(je.totalDebit || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-semibold text-red-600">${Number(je.totalCredit || 0).toLocaleString()}</td>
                      <td className="py-3 px-3"><Badge variant={je.status === 'posted' ? 'success' : je.status === 'reversed' ? 'error' : 'default'}>{je.status as string}</Badge></td>
                      <td className="py-3 px-3">
                        {je.status === 'draft' && (
                          <button onClick={() => { if (confirm('Post this journal entry?')) postMut.mutate(je.id as string); }} className="p-1.5 text-surface-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Post Entry"><CheckCircle size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-surface-400">No journal entries</td></tr>}
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

      {/* Account Modal */}
      <Modal isOpen={acctModalOpen} onClose={() => setAcctModalOpen(false)} title={editingAcct ? 'Edit Account' : 'Add Account'}>
        <form onSubmit={e => { e.preventDefault(); acctMut.mutate(acctForm); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Code *" value={(acctForm.accountCode as string) || ''} onChange={v => setAcctForm(f => ({ ...f, accountCode: v }))} required />
            <Input label="Account Name *" value={(acctForm.accountName as string) || ''} onChange={v => setAcctForm(f => ({ ...f, accountName: v }))} required />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Account Type *</label>
              <select value={(acctForm.accountType as string) || 'asset'} onChange={e => setAcctForm(f => ({ ...f, accountType: e.target.value }))} className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-300">
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Description" value={(acctForm.description as string) || ''} onChange={v => setAcctForm(f => ({ ...f, description: v }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setAcctModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={acctMut.isPending}>{editingAcct ? 'Update' : 'Create'} Account</Button>
          </div>
        </form>
      </Modal>

      {/* Journal Entry Modal */}
      <Modal isOpen={jeModalOpen} onClose={() => setJeModalOpen(false)} title="New Journal Entry" size="xl">
        <form onSubmit={e => { e.preventDefault(); jeMut.mutate(jeForm); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Entry Number *" value={(jeForm.entryNumber as string) || ''} onChange={v => setJeForm(f => ({ ...f, entryNumber: v }))} required />
            <Input label="Posting Date" type="date" value={(jeForm.postingDate as string) || ''} onChange={v => setJeForm(f => ({ ...f, postingDate: v }))} />
            <div className="col-span-2">
              <Input label="Description *" value={(jeForm.description as string) || ''} onChange={v => setJeForm(f => ({ ...f, description: v }))} required />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700 dark:text-surface-300">Lines (must balance)</label>
              <button type="button" onClick={addJeLine} className="text-xs text-primary-600 hover:underline flex items-center gap-1"><Plus size={12} />Add Line</button>
            </div>
            <div className="space-y-2">
              {(jeForm.lines as Record<string, unknown>[]).map((line, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <select value={(line.accountId as string) || ''} onChange={e => updateJeLine(idx, 'accountId', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300">
                      <option value="">Account</option>
                      {(accounts as Record<string, unknown>[]).map(a => <option key={a.id as string} value={a.id as string}>{a.accountCode as string} - {a.accountName as string}</option>)}
                    </select>
                  </div>
                  <input placeholder="Description" value={(line.description as string) || ''} onChange={e => updateJeLine(idx, 'description', e.target.value)} className="px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <input placeholder="Debit" type="number" value={(line.debitAmount as string) || ''} onChange={e => updateJeLine(idx, 'debitAmount', e.target.value)} className="px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <input placeholder="Credit" type="number" value={(line.creditAmount as string) || ''} onChange={e => updateJeLine(idx, 'creditAmount', e.target.value)} className="px-2 py-1.5 text-xs border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 focus:outline-none focus:ring-1 focus:ring-primary-300" />
                  <button type="button" onClick={() => removeJeLine(idx)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                </div>
              ))}
            </div>
            {(jeForm.lines as Record<string, unknown>[]).length > 0 && (
              <div className={`flex justify-end gap-6 mt-2 text-sm font-medium ${Math.abs(jeTotals.debit - jeTotals.credit) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                <span>Total Debit: ${jeTotals.debit.toFixed(2)}</span>
                <span>Total Credit: ${jeTotals.credit.toFixed(2)}</span>
                {Math.abs(jeTotals.debit - jeTotals.credit) > 0.01 && <span className="text-red-500 text-xs">Not balanced!</span>}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="outline" onClick={() => setJeModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={jeMut.isPending}>Create Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Finance;
