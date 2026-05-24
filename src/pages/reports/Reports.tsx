import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, BookOpen, TrendingUp, Users, ShoppingCart, Package, Briefcase, DollarSign, AlertTriangle } from 'lucide-react';
import { hrmsApi, crmApi, salesApi, inventoryApi, projectsApi, financeApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

const KPI: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }> = ({ label, value, sub, icon, color }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
        <p className="text-2xl font-bold mt-1 text-surface-900 dark:text-surface-50">{value}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: color }}>{icon}</div>
    </div>
  </Card>
);

const Reports: React.FC = () => {
  const [section, setSection] = useState<'overview' | 'hr' | 'sales' | 'inventory' | 'finance' | 'projects'>('overview');

  const { data: hrStats, isLoading: hrLoading } = useQuery({ queryKey: ['hrms-stats'], queryFn: hrmsApi.getStats });
  const { data: crmStats, isLoading: crmLoading } = useQuery({ queryKey: ['crm-stats'], queryFn: crmApi.getStats });
  const { data: salesStats, isLoading: salesLoading } = useQuery({ queryKey: ['sales-stats'], queryFn: salesApi.getStats });
  const { data: invStats, isLoading: invLoading } = useQuery({ queryKey: ['inv-stats'], queryFn: inventoryApi.getStats });
  const { data: projStats, isLoading: projLoading } = useQuery({ queryKey: ['proj-stats'], queryFn: projectsApi.getStats });
  const { data: finStats, isLoading: finLoading } = useQuery({ queryKey: ['finance-stats'], queryFn: financeApi.getStats });

  const { data: invItems } = useQuery({
    queryKey: ['inv-items-report'],
    queryFn: () => inventoryApi.getItems({ limit: 5 }),
    enabled: section === 'inventory',
  });
  const { data: projData } = useQuery({
    queryKey: ['projects-report'],
    queryFn: () => projectsApi.getProjects({ limit: 5, status: 'active' }),
    enabled: section === 'projects',
  });

  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'hr', label: 'HR' },
    { key: 'sales', label: 'Sales & CRM' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'finance', label: 'Finance' },
    { key: 'projects', label: 'Projects' },
  ] as const;

  const isLoading = hrLoading || crmLoading || salesLoading || invLoading || projLoading || finLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Reports & Business Intelligence</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Cross-module analytics and key performance indicators</p>
      </div>

      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
        {sections.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${section === s.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>{s.label}</button>
        ))}
      </div>

      {isLoading && section === 'overview' && <LoadingSpinner />}

      {section === 'overview' && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPI label="Employees" value={hrStats?.totalEmployees ?? 0} sub={`${hrStats?.activeEmployees ?? 0} active`} icon={<Users size={18} />} color="#6366f1" />
            <KPI label="Customers" value={crmStats?.totalCustomers ?? 0} sub={`${crmStats?.activeLeads ?? 0} leads`} icon={<Users size={18} />} color="#10b981" />
            <KPI label="Sales Orders" value={salesStats?.totalOrders ?? 0} sub="this period" icon={<ShoppingCart size={18} />} color="#f59e0b" />
            <KPI label="Inventory Items" value={invStats?.totalItems ?? 0} sub={`${invStats?.lowStockItems ?? 0} low stock`} icon={<Package size={18} />} color="#8b5cf6" />
            <KPI label="Active Projects" value={projStats?.activeProjects ?? 0} sub={`${projStats?.totalProjects ?? 0} total`} icon={<Briefcase size={18} />} color="#06b6d4" />
            <KPI label="Net Income" value={finStats?.netIncome ? `$${Number(finStats.netIncome).toLocaleString()}` : '$0'} sub="this period" icon={<DollarSign size={18} />} color="#10b981" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary-500" />Sales Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Revenue (Month)', value: salesStats?.monthRevenue ? `$${Number(salesStats.monthRevenue).toLocaleString()}` : '$0', color: 'text-green-600' },
                  { label: 'Pending Invoices', value: salesStats?.pendingInvoices ?? 0, color: 'text-yellow-600' },
                  { label: 'Overdue Invoices', value: salesStats?.overdueInvoices ?? 0, color: 'text-red-600' },
                  { label: 'CRM Pipeline Value', value: crmStats?.pipelineValue ? `$${Number(crmStats.pipelineValue).toLocaleString()}` : '$0', color: 'text-blue-600' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-surface-50 dark:border-surface-800">
                    <span className="text-sm text-surface-600 dark:text-surface-400">{row.label}</span>
                    <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-primary-500" />Financial Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Revenue', value: finStats?.totalRevenue ? `$${Number(finStats.totalRevenue).toLocaleString()}` : '$0', color: 'text-green-600' },
                  { label: 'Total Expenses', value: finStats?.totalExpenses ? `$${Number(finStats.totalExpenses).toLocaleString()}` : '$0', color: 'text-red-600' },
                  { label: 'Net Income', value: finStats?.netIncome ? `$${Number(finStats.netIncome).toLocaleString()}` : '$0', color: Number(finStats?.netIncome) >= 0 ? 'text-green-600' : 'text-red-600' },
                  { label: 'Chart of Accounts', value: finStats?.accounts ?? 0, color: 'text-blue-600' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-surface-50 dark:border-surface-800">
                    <span className="text-sm text-surface-600 dark:text-surface-400">{row.label}</span>
                    <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {(invStats?.lowStockItems > 0 || invStats?.outOfStockItems > 0) && (
            <Card>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2 text-amber-600"><AlertTriangle size={16} />Inventory Alerts</h3>
              <div className="flex gap-4">
                {invStats?.lowStockItems > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><Badge variant="warning">{invStats.lowStockItems}</Badge><span className="text-sm text-amber-700 dark:text-amber-400">items at low stock</span></div>}
                {invStats?.outOfStockItems > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><Badge variant="error">{invStats.outOfStockItems}</Badge><span className="text-sm text-red-700 dark:text-red-400">items out of stock</span></div>}
              </div>
            </Card>
          )}
        </div>
      )}

      {section === 'hr' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Employees" value={hrStats?.totalEmployees ?? 0} icon={<Users size={18} />} color="#6366f1" />
          <KPI label="Active" value={hrStats?.activeEmployees ?? 0} icon={<Users size={18} />} color="#10b981" />
          <KPI label="On Leave" value={hrStats?.onLeave ?? 0} icon={<Users size={18} />} color="#f59e0b" />
          <KPI label="Departments" value={hrStats?.departments ?? 0} icon={<Users size={18} />} color="#8b5cf6" />
        </div>
      )}

      {section === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Customers" value={crmStats?.totalCustomers ?? 0} icon={<Users size={18} />} color="#6366f1" />
            <KPI label="Active Leads" value={crmStats?.activeLeads ?? 0} icon={<TrendingUp size={18} />} color="#10b981" />
            <KPI label="Pipeline Value" value={crmStats?.pipelineValue ? `$${Number(crmStats.pipelineValue).toLocaleString()}` : '$0'} icon={<DollarSign size={18} />} color="#f59e0b" />
            <KPI label="Total Orders" value={salesStats?.totalOrders ?? 0} icon={<ShoppingCart size={18} />} color="#8b5cf6" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Month Revenue" value={salesStats?.monthRevenue ? `$${Number(salesStats.monthRevenue).toLocaleString()}` : '$0'} icon={<DollarSign size={18} />} color="#10b981" />
            <KPI label="Pending Invoices" value={salesStats?.pendingInvoices ?? 0} icon={<AlertTriangle size={18} />} color="#f59e0b" />
            <KPI label="Overdue Invoices" value={salesStats?.overdueInvoices ?? 0} icon={<AlertTriangle size={18} />} color="#ef4444" />
          </div>
        </div>
      )}

      {section === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Total Items" value={invStats?.totalItems ?? 0} icon={<Package size={18} />} color="#6366f1" />
            <KPI label="Low Stock" value={invStats?.lowStockItems ?? 0} icon={<AlertTriangle size={18} />} color="#f59e0b" />
            <KPI label="Out of Stock" value={invStats?.outOfStockItems ?? 0} icon={<AlertTriangle size={18} />} color="#ef4444" />
            <KPI label="Warehouses" value={invStats?.warehouses ?? 0} icon={<Package size={18} />} color="#8b5cf6" />
          </div>
          {invItems?.data && (
            <Card>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Recent Inventory Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-surface-100 dark:border-surface-800">{['SKU', 'Item', 'Stock', 'Reorder Level', 'Status'].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-surface-500">{h}</th>)}</tr></thead>
                  <tbody>
                    {(invItems.data as Record<string, unknown>[]).map(item => (
                      <tr key={item.id as string} className="border-b border-surface-50 dark:border-surface-800/50">
                        <td className="py-2 px-3 font-mono text-xs text-primary-600">{item.sku as string}</td>
                        <td className="py-2 px-3">{item.itemName as string}</td>
                        <td className="py-2 px-3 font-semibold">{item.currentStock as number}</td>
                        <td className="py-2 px-3 text-surface-400">{item.reorderLevel as number}</td>
                        <td className="py-2 px-3">
                          <Badge variant={(item.currentStock as number) <= 0 ? 'error' : (item.currentStock as number) <= (item.reorderLevel as number) ? 'warning' : 'success'}>
                            {(item.currentStock as number) <= 0 ? 'Out' : (item.currentStock as number) <= (item.reorderLevel as number) ? 'Low' : 'OK'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {section === 'finance' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Revenue" value={finStats?.totalRevenue ? `$${Number(finStats.totalRevenue).toLocaleString()}` : '$0'} icon={<TrendingUp size={18} />} color="#10b981" />
          <KPI label="Total Expenses" value={finStats?.totalExpenses ? `$${Number(finStats.totalExpenses).toLocaleString()}` : '$0'} icon={<DollarSign size={18} />} color="#ef4444" />
          <KPI label="Net Income" value={finStats?.netIncome ? `$${Number(finStats.netIncome).toLocaleString()}` : '$0'} icon={<BarChart2 size={18} />} color={Number(finStats?.netIncome) >= 0 ? '#10b981' : '#ef4444'} />
          <KPI label="Accounts" value={finStats?.accounts ?? 0} icon={<BookOpen size={18} />} color="#8b5cf6" />
        </div>
      )}

      {section === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Total Projects" value={projStats?.totalProjects ?? 0} icon={<Briefcase size={18} />} color="#6366f1" />
            <KPI label="Active" value={projStats?.activeProjects ?? 0} icon={<Briefcase size={18} />} color="#10b981" />
            <KPI label="Completed" value={projStats?.completedProjects ?? 0} icon={<Briefcase size={18} />} color="#8b5cf6" />
            <KPI label="On Hold" value={projStats?.onHoldProjects ?? 0} icon={<Briefcase size={18} />} color="#f59e0b" />
          </div>
          {projData?.data && (
            <Card>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Active Projects</h3>
              <div className="space-y-3">
                {(projData.data as Record<string, unknown>[]).map(proj => (
                  <div key={proj.id as string} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{proj.projectName as string}</p>
                      <p className="text-xs text-surface-400">{(proj.customer as { customerName: string } | undefined)?.customerName || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-24 bg-surface-100 dark:bg-surface-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${proj.progressPercent as number}%` }} />
                      </div>
                      <span className="text-xs font-medium text-surface-600 w-8 text-right">{proj.progressPercent as number}%</span>
                      <Badge variant="success">active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
