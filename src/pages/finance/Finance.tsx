import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, BarChart2, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { financeApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  PageHeader, StatCard, TabBar, Toolbar, Table, TR, TD, MonoCell,
  EmptyRow, ActionBtn, Pagination, FieldSelect, FormFooter,
} from '../../components/erp/ModuleShell';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];
const EMPTY_ACCOUNT = { accountCode: '', accountName: '', accountType: 'asset', description: '', parentId: '' };
const EMPTY_ENTRY = {
  entryNumber: '', description: '',
  postingDate: new Date().toISOString().split('T')[0],
  fiscalYear: new Date().getFullYear().toString(),
  lines: [] as Record<string, unknown>[],
};
const EMPTY_JE_LINE = { accountId: '', description: '', debitAmount: '', creditAmount: '' };

const ACCT_TYPE_COLORS: Record<string, 'success' | 'error' | 'primary' | 'warning' | 'default'> = {
  asset: 'success', liability: 'error', equity: 'primary', revenue: 'primary', expense: 'warning',
};

const TABS = ['accounts', 'journal'] as const;

const lineCls = 'px-2 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/60 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all w-full';

const Finance: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>('accounts');
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
    mutationFn: (data: Record<string, unknown>) =>
      editingAcct ? financeApi.updateAccount(editingAcct.id as string, data) : financeApi.createAccount(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-accounts'] });
      setAcctModalOpen(false); setEditingAcct(null); setAcctForm(EMPTY_ACCOUNT);
      toast.success('Account saved');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'),
  });
  const deleteAcctMut = useMutation({
    mutationFn: financeApi.deleteAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-accounts'] }); toast.success('Account deleted'); },
  });
  const jeMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => financeApi.createJournalEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-je'] });
      qc.invalidateQueries({ queryKey: ['finance-stats'] });
      setJeModalOpen(false); setJeForm(EMPTY_ENTRY);
      toast.success('Journal entry created');
    },
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

  const jeTotals = (jeForm.lines as Record<string, unknown>[]).reduce(
    (acc, l) => ({ debit: acc.debit + (Number(l.debitAmount) || 0), credit: acc.credit + (Number(l.creditAmount) || 0) }),
    { debit: 0, credit: 0 }
  );
  const isBalanced = Math.abs(jeTotals.debit - jeTotals.credit) <= 0.01;

  const fa = (k: string) => (acctForm[k] as string) || '';
  const sfa = (k: string) => (v: string) => setAcctForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader title="Finance & Accounting" subtitle="Chart of accounts, journal entries and financial reports" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"  value={stats?.totalRevenue  ? `$${Number(stats.totalRevenue).toLocaleString()}`  : '-'} icon={<BarChart2 size={15} />} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Total Expenses" value={stats?.totalExpenses ? `$${Number(stats.totalExpenses).toLocaleString()}` : '-'} icon={<BarChart2 size={15} />} gradient="from-red-500 to-rose-600" />
        <StatCard label="Net Income"     value={stats?.netIncome     ? `$${Number(stats.netIncome).toLocaleString()}`     : '-'} icon={<BarChart2 size={15} />} gradient="from-primary-500 to-primary-700" />
        <StatCard label="Accounts"       value={stats?.accounts ?? '-'}                                                          icon={<BookOpen size={15} />}  gradient="from-violet-500 to-purple-700" />
      </div>

      <TabBar
        tabs={TABS}
        active={tab}
        onChange={t => { setTab(t as typeof TABS[number]); setPage(1); setSearch(''); }}
        labels={{ accounts: 'Chart of Accounts', journal: 'Journal Entries' }}
      />

      {tab === 'accounts' && (
        <Card>
          <Toolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search accounts…"
            onAdd={() => { setEditingAcct(null); setAcctForm(EMPTY_ACCOUNT); setAcctModalOpen(true); }}
            addLabel="Add Account"
          />

          {acctLoading ? <LoadingSpinner /> : (
            <Table headers={['Code', 'Account Name', 'Type', 'Balance', 'Actions']}>
              {(accounts as Record<string, unknown>[]).map(acc => (
                <TR key={acc.id as string}>
                  <MonoCell>{acc.accountCode as string}</MonoCell>
                  <TD className="font-semibold text-sm text-surface-900 dark:text-surface-100">{acc.accountName as string}</TD>
                  <TD>
                    <Badge variant={ACCT_TYPE_COLORS[acc.accountType as string] || 'default'}>
                      {acc.accountType as string}
                    </Badge>
                  </TD>
                  <TD className="font-semibold text-sm text-surface-800 dark:text-surface-200">
                    ${Number(acc.balance || 0).toLocaleString()}
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      <ActionBtn color="primary" onClick={() => { setEditingAcct(acc); setAcctForm({ ...acc }); setAcctModalOpen(true); }} title="Edit">
                        <Edit2 size={13} />
                      </ActionBtn>
                      <ActionBtn color="danger" onClick={() => { if (confirm('Delete this account?')) deleteAcctMut.mutate(acc.id as string); }} title="Delete">
                        <Trash2 size={13} />
                      </ActionBtn>
                    </div>
                  </TD>
                </TR>
              ))}
              {(accounts as Record<string, unknown>[]).length === 0 && <EmptyRow colSpan={5} message="No accounts found" />}
            </Table>
          )}
        </Card>
      )}

      {tab === 'journal' && (
        <Card>
          <Toolbar
            search={search}
            onSearch={v => { setSearch(v); setPage(1); }}
            placeholder="Search journal entries…"
            onAdd={() => { setJeForm(EMPTY_ENTRY); setJeModalOpen(true); }}
            addLabel="New Entry"
          />

          {jeLoading ? <LoadingSpinner /> : (
            <>
              <Table headers={['Entry #', 'Description', 'Date', 'Debit', 'Credit', 'Status', 'Actions']}>
                {entries.map((je: Record<string, unknown>) => (
                  <TR key={je.id as string}>
                    <MonoCell>{je.entryNumber as string}</MonoCell>
                    <TD className="text-sm text-surface-900 dark:text-surface-100 max-w-[200px] truncate">{je.description as string}</TD>
                    <TD className="text-surface-500 text-xs">{je.postingDate as string}</TD>
                    <TD className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                      ${Number(je.totalDebit || 0).toLocaleString()}
                    </TD>
                    <TD className="font-semibold text-sm text-red-600 dark:text-red-400">
                      ${Number(je.totalCredit || 0).toLocaleString()}
                    </TD>
                    <TD>
                      <Badge variant={je.status === 'posted' ? 'success' : je.status === 'reversed' ? 'error' : 'default'}>
                        {je.status as string}
                      </Badge>
                    </TD>
                    <TD>
                      {je.status === 'draft' && (
                        <ActionBtn color="success" onClick={() => { if (confirm('Post this journal entry?')) postMut.mutate(je.id as string); }} title="Post Entry">
                          <CheckCircle size={13} />
                        </ActionBtn>
                      )}
                    </TD>
                  </TR>
                ))}
                {entries.length === 0 && <EmptyRow colSpan={7} message="No journal entries found" />}
              </Table>
              <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
            </>
          )}
        </Card>
      )}

      {/* Account Modal */}
      <Modal isOpen={acctModalOpen} onClose={() => setAcctModalOpen(false)} title={editingAcct ? 'Edit Account' : 'Add Account'}>
        <form onSubmit={e => { e.preventDefault(); acctMut.mutate(acctForm); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Account Code *" value={fa('accountCode')} onChange={sfa('accountCode')} required />
            <Input label="Account Name *" value={fa('accountName')} onChange={sfa('accountName')} required />
            <FieldSelect label="Account Type *" value={fa('accountType') || 'asset'} onChange={sfa('accountType')} required>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </FieldSelect>
            <Input label="Description" value={fa('description')} onChange={sfa('description')} />
          </div>
          <FormFooter onCancel={() => setAcctModalOpen(false)} submitLabel={editingAcct ? 'Update Account' : 'Create Account'} loading={acctMut.isPending} />
        </form>
      </Modal>

      {/* Journal Entry Modal */}
      <Modal isOpen={jeModalOpen} onClose={() => setJeModalOpen(false)} title="New Journal Entry" size="xl">
        <form onSubmit={e => { e.preventDefault(); jeMut.mutate(jeForm); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Entry Number *" value={(jeForm.entryNumber as string) || ''} onChange={v => setJeForm(f => ({ ...f, entryNumber: v }))} required />
            <Input label="Posting Date" type="date" value={(jeForm.postingDate as string) || ''} onChange={v => setJeForm(f => ({ ...f, postingDate: v }))} />
            <div className="col-span-2">
              <Input label="Description *" value={(jeForm.description as string) || ''} onChange={v => setJeForm(f => ({ ...f, description: v }))} required />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                Lines <span className="text-surface-400 font-normal normal-case tracking-normal">(must balance)</span>
              </label>
              <button type="button" onClick={addJeLine} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
                <Plus size={12} /> Add Line
              </button>
            </div>
            <div className="space-y-2">
              {(jeForm.lines as Record<string, unknown>[]).map((line, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <select
                    value={(line.accountId as string) || ''}
                    onChange={e => updateJeLine(idx, 'accountId', e.target.value)}
                    className={lineCls}
                  >
                    <option value="">Account</option>
                    {(accounts as Record<string, unknown>[]).map(a => (
                      <option key={a.id as string} value={a.id as string}>{a.accountCode as string} – {a.accountName as string}</option>
                    ))}
                  </select>
                  <input placeholder="Description" value={(line.description as string) || ''} onChange={e => updateJeLine(idx, 'description', e.target.value)} className={lineCls} />
                  <input placeholder="Debit" type="number" value={(line.debitAmount as string) || ''} onChange={e => updateJeLine(idx, 'debitAmount', e.target.value)} className={lineCls} />
                  <input placeholder="Credit" type="number" value={(line.creditAmount as string) || ''} onChange={e => updateJeLine(idx, 'creditAmount', e.target.value)} className={lineCls} />
                  <button type="button" onClick={() => removeJeLine(idx)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                </div>
              ))}
            </div>
            {(jeForm.lines as Record<string, unknown>[]).length > 0 && (
              <div className={`flex items-center justify-end gap-6 mt-3 text-xs font-semibold ${isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <span>Debit: ${jeTotals.debit.toFixed(2)}</span>
                <span>Credit: ${jeTotals.credit.toFixed(2)}</span>
                {!isBalanced && <span className="text-red-500">Not balanced!</span>}
              </div>
            )}
          </div>

          <FormFooter onCancel={() => setJeModalOpen(false)} submitLabel="Create Entry" loading={jeMut.isPending} />
        </form>
      </Modal>
    </div>
  );
};

export default Finance;
