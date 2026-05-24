import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, BookOpen, TrendingUp, Users, ShoppingCart, Package, Briefcase, DollarSign, AlertTriangle } from 'lucide-react';
import { hrmsApi, crmApi, salesApi, inventoryApi, projectsApi, financeApi } from '../../services/erp.service';
import { Card } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { PageHeader, TabBar, MonoCell } from '../../components/erp/ModuleShell';

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KPI: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string }> = ({ label, value, sub, icon, gradient }) => (
  <div className={`relative rounded-2xl p-5 overflow-hidden text-white bg-gradient-to-br ${gradient} transition-all duration-200 hover:-translate-y-px hover:shadow-lg`}>
    <div className="absolute -right-3 -top-3 w-20 h-20 rounded-full bg-white/10" />
    <div className="absolute right-2 -bottom-4 w-12 h-12 rounded-full bg-white/5" />
    <div className="relative">
      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-white/70 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-white/50 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Summary Row ─────────────────────────────────────────────────────────────
const SummaryRow: React.FC<{ label: string; value: string | number; valueClass?: string }> = ({ label, value, valueClass = 'text-surface-800 dark:text-surface-200' }) => (
  <div className="flex justify-between items-center py-2 border-b border-surface-50 dark:border-surface-800/60 last:border-0">
    <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
    <span className={`font-semibold text-sm ${valueClass}`}>{value}</span>
  </div>
);

const SECTIONS = ['overview', 'hr', 'sales', 'inventory', 'finance', 'projects'] as const;
type Section = typeof SECTIONS[number];

const SECTION_LABELS: Record<Section, string> = {
  overview: 'Overview', hr: 'HR', sales: 'Sales & CRM',
  inventory: 'Inventory', finance: 'Finance', projects: 'Projects',
};

const Reports: React.FC = () => {
  const [section, setSection] = useState<Section>('overview');

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

  const isLoading = hrLoading || crmLoading || salesLoading || invLoading || projLoading || finLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Business Intelligence" subtitle="Cross-module analytics and key performance indicators" />

      <TabBar
        tabs={SECTIONS}
        active={section}
        onChange={t => setSection(t as Section)}
        labels={SECTION_LABELS}
      />

      {isLoading && section === 'overview' && <LoadingSpinner />}

      {section === 'overview' && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPI label="Employees"       value={hrStats?.totalEmployees ?? 0}    sub={`${hrStats?.activeEmployees ?? 0} active`}           icon={<Users size={15} />}       gradient="from-primary-500 to-primary-700" />
            <KPI label="Customers"       value={crmStats?.totalCustomers ?? 0}   sub={`${crmStats?.activeLeads ?? 0} leads`}               icon={<Users size={15} />}       gradient="from-emerald-500 to-teal-600" />
            <KPI label="Sales Orders"    value={salesStats?.totalOrders ?? 0}    sub="this period"                                         icon={<ShoppingCart size={15} />} gradient="from-amber-500 to-orange-600" />
            <KPI label="Inv. Items"      value={invStats?.totalItems ?? 0}       sub={`${invStats?.lowStockItems ?? 0} low stock`}          icon={<Package size={15} />}     gradient="from-violet-500 to-purple-700" />
            <KPI label="Active Projects" value={projStats?.activeProjects ?? 0}  sub={`${projStats?.totalProjects ?? 0} total`}            icon={<Briefcase size={15} />}   gradient="from-cyan-500 to-sky-600" />
            <KPI label="Net Income"      value={finStats?.netIncome ? `$${Number(finStats.netIncome).toLocaleString()}` : '$0'} sub="this period" icon={<DollarSign size={15} />} gradient="from-rose-500 to-pink-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-primary-500" /> Sales Summary
              </h3>
              <SummaryRow label="Revenue (Month)" value={salesStats?.monthRevenue ? `$${Number(salesStats.monthRevenue).toLocaleString()}` : '$0'} valueClass="text-emerald-600 dark:text-emerald-400" />
              <SummaryRow label="Pending Invoices" value={salesStats?.pendingInvoices ?? 0} valueClass="text-amber-600 dark:text-amber-400" />
              <SummaryRow label="Overdue Invoices" value={salesStats?.overdueInvoices ?? 0} valueClass="text-red-600 dark:text-red-400" />
              <SummaryRow label="CRM Pipeline Value" value={crmStats?.pipelineValue ? `$${Number(crmStats.pipelineValue).toLocaleString()}` : '$0'} valueClass="text-primary-600 dark:text-primary-400" />
            </Card>

            <Card>
              <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                <BarChart2 size={15} className="text-primary-500" /> Financial Summary
              </h3>
              <SummaryRow label="Total Revenue"    value={finStats?.totalRevenue  ? `$${Number(finStats.totalRevenue).toLocaleString()}`  : '$0'} valueClass="text-emerald-600 dark:text-emerald-400" />
              <SummaryRow label="Total Expenses"   value={finStats?.totalExpenses ? `$${Number(finStats.totalExpenses).toLocaleString()}` : '$0'} valueClass="text-red-600 dark:text-red-400" />
              <SummaryRow label="Net Income"       value={finStats?.netIncome     ? `$${Number(finStats.netIncome).toLocaleString()}`     : '$0'} valueClass={Number(finStats?.netIncome) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
              <SummaryRow label="Chart of Accounts" value={finStats?.accounts ?? 0} />
            </Card>
          </div>

          {((invStats?.lowStockItems ?? 0) > 0 || (invStats?.outOfStockItems ?? 0) > 0) && (
            <Card>
              <h3 className="font-semibold text-sm text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                <AlertTriangle size={15} /> Inventory Alerts
              </h3>
              <div className="flex flex-wrap gap-3">
                {(invStats?.lowStockItems ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <Badge variant="warning">{invStats.lowStockItems}</Badge>
                    <span className="text-sm text-amber-700 dark:text-amber-400">items at low stock</span>
                  </div>
                )}
                {(invStats?.outOfStockItems ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <Badge variant="error">{invStats.outOfStockItems}</Badge>
                    <span className="text-sm text-red-700 dark:text-red-400">items out of stock</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {section === 'hr' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Employees" value={hrStats?.totalEmployees ?? 0} icon={<Users size={15} />} gradient="from-primary-500 to-primary-700" />
          <KPI label="Active"          value={hrStats?.activeEmployees ?? 0} icon={<Users size={15} />} gradient="from-emerald-500 to-teal-600" />
          <KPI label="On Leave"        value={hrStats?.onLeave ?? 0}         icon={<Users size={15} />} gradient="from-amber-500 to-orange-600" />
          <KPI label="Departments"     value={hrStats?.departments ?? 0}     icon={<Users size={15} />} gradient="from-violet-500 to-purple-700" />
        </div>
      )}

      {section === 'sales' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Customers"     value={crmStats?.totalCustomers ?? 0}                                                                     icon={<Users size={15} />}       gradient="from-primary-500 to-primary-700" />
            <KPI label="Active Leads"  value={crmStats?.activeLeads ?? 0}                                                                        icon={<TrendingUp size={15} />}  gradient="from-emerald-500 to-teal-600" />
            <KPI label="Pipeline"      value={crmStats?.pipelineValue ? `$${Number(crmStats.pipelineValue).toLocaleString()}` : '$0'}             icon={<DollarSign size={15} />}  gradient="from-amber-500 to-orange-600" />
            <KPI label="Total Orders"  value={salesStats?.totalOrders ?? 0}                                                                      icon={<ShoppingCart size={15} />} gradient="from-violet-500 to-purple-700" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPI label="Month Revenue"     value={salesStats?.monthRevenue ? `$${Number(salesStats.monthRevenue).toLocaleString()}` : '$0'} icon={<DollarSign size={15} />}    gradient="from-emerald-500 to-teal-600" />
            <KPI label="Pending Invoices"  value={salesStats?.pendingInvoices ?? 0}                                                         icon={<AlertTriangle size={15} />} gradient="from-amber-500 to-orange-600" />
            <KPI label="Overdue Invoices"  value={salesStats?.overdueInvoices ?? 0}                                                         icon={<AlertTriangle size={15} />} gradient="from-red-500 to-rose-600" />
          </div>
        </div>
      )}

      {section === 'inventory' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Total Items"   value={invStats?.totalItems ?? 0}       icon={<Package size={15} />}       gradient="from-primary-500 to-primary-700" />
            <KPI label="Low Stock"     value={invStats?.lowStockItems ?? 0}    icon={<AlertTriangle size={15} />} gradient="from-amber-500 to-orange-600" />
            <KPI label="Out of Stock"  value={invStats?.outOfStockItems ?? 0}  icon={<AlertTriangle size={15} />} gradient="from-red-500 to-rose-600" />
            <KPI label="Warehouses"    value={invStats?.warehouses ?? 0}       icon={<Package size={15} />}       gradient="from-violet-500 to-purple-700" />
          </div>
          {invItems?.data && (
            <Card>
              <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100 mb-4">Recent Inventory Items</h3>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm min-w-max">
                  <thead>
                    <tr className="border-b border-surface-100 dark:border-surface-800">
                      {['SKU', 'Item', 'Stock', 'Reorder Level', 'Status'].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-[10px] font-semibold text-surface-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(invItems.data as Record<string, unknown>[]).map(item => (
                      <tr key={item.id as string} className="border-b border-surface-50 dark:border-surface-800/40 hover:bg-surface-50/80 dark:hover:bg-surface-800/30">
                        <MonoCell>{item.sku as string}</MonoCell>
                        <td className="py-3 px-3 font-medium text-sm text-surface-900 dark:text-surface-100">{item.itemName as string}</td>
                        <td className="py-3 px-3 font-semibold text-sm text-surface-800 dark:text-surface-200">{item.currentStock as number}</td>
                        <td className="py-3 px-3 text-surface-400 text-xs">{item.reorderLevel as number}</td>
                        <td className="py-3 px-3">
                          <Badge variant={(item.currentStock as number) <= 0 ? 'error' : (item.currentStock as number) <= (item.reorderLevel as number) ? 'warning' : 'success'}>
                            {(item.currentStock as number) <= 0 ? 'Out of Stock' : (item.currentStock as number) <= (item.reorderLevel as number) ? 'Low Stock' : 'In Stock'}
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
          <KPI label="Total Revenue"  value={finStats?.totalRevenue  ? `$${Number(finStats.totalRevenue).toLocaleString()}`  : '$0'} icon={<TrendingUp size={15} />} gradient="from-emerald-500 to-teal-600" />
          <KPI label="Total Expenses" value={finStats?.totalExpenses ? `$${Number(finStats.totalExpenses).toLocaleString()}` : '$0'} icon={<DollarSign size={15} />} gradient="from-red-500 to-rose-600" />
          <KPI label="Net Income"     value={finStats?.netIncome     ? `$${Number(finStats.netIncome).toLocaleString()}`     : '$0'} icon={<BarChart2 size={15} />}  gradient={Number(finStats?.netIncome) >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'} />
          <KPI label="Accounts"       value={finStats?.accounts ?? 0}                                                                icon={<BookOpen size={15} />}   gradient="from-violet-500 to-purple-700" />
        </div>
      )}

      {section === 'projects' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Total Projects" value={projStats?.totalProjects ?? 0}    icon={<Briefcase size={15} />} gradient="from-primary-500 to-primary-700" />
            <KPI label="Active"         value={projStats?.activeProjects ?? 0}   icon={<Briefcase size={15} />} gradient="from-emerald-500 to-teal-600" />
            <KPI label="Completed"      value={projStats?.completedProjects ?? 0} icon={<Briefcase size={15} />} gradient="from-violet-500 to-purple-700" />
            <KPI label="On Hold"        value={projStats?.onHoldProjects ?? 0}   icon={<Briefcase size={15} />} gradient="from-amber-500 to-orange-600" />
          </div>
          {projData?.data && (
            <Card>
              <h3 className="font-semibold text-sm text-surface-900 dark:text-surface-100 mb-4">Active Projects</h3>
              <div className="space-y-3">
                {(projData.data as Record<string, unknown>[]).map(proj => (
                  <div key={proj.id as string} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{proj.projectName as string}</p>
                      <p className="text-[11px] text-surface-400 mt-0.5">
                        {(proj.customer as { customerName: string } | undefined)?.customerName || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${proj.progressPercent as number}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-surface-600 dark:text-surface-400 w-8 text-right">{proj.progressPercent as number}%</span>
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
