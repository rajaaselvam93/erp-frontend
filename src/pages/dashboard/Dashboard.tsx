import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Layers, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle, Clock } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import api from '../../services/api.service';
import { Card, CardHeader } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  change?: number;
  subtitle?: string;
}> = ({ title, value, icon, gradient, change, subtitle }) => (
  <div className={clsx(
    'relative rounded-2xl p-5 text-white overflow-hidden',
    'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
    gradient
  )}>
    {/* Background decoration */}
    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -right-1 -bottom-6 w-16 h-16 rounded-full bg-white/5" />

    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          {icon}
        </div>
        {change !== undefined && (
          <div className={clsx(
            'flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
            change >= 0 ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
          )}>
            {change >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-white/70 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const customTooltipStyle = {
  borderRadius: 10,
  border: 'none',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  fontSize: 12,
  padding: '8px 12px',
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await api.get('/dashboard/stats')).data.data,
  });
  const { data: activityChart } = useQuery({
    queryKey: ['activity-chart'],
    queryFn: async () => (await api.get('/dashboard/activity-chart', { params: { days: 30 } })).data.data,
  });
  const { data: moduleUsage } = useQuery({
    queryKey: ['module-usage'],
    queryFn: async () => (await api.get('/dashboard/module-usage')).data.data,
  });
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => (await api.get('/dashboard/activity', { params: { limit: 10 } })).data.data,
  });
  const { data: userGrowth } = useQuery({
    queryKey: ['user-growth'],
    queryFn: async () => (await api.get('/dashboard/user-growth', { params: { months: 6 } })).data.data,
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const actionIconMap: Record<string, React.ReactNode> = {
    create: <CheckCircle size={13} className="text-emerald-500" />,
    update: <TrendingUp size={13} className="text-blue-500" />,
    delete: <Activity size={13} className="text-red-500" />,
    login:  <Clock size={13} className="text-purple-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 tracking-tight">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Here's what's happening across your workspace today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </div>
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats?.users.total || 0}
            icon={<Users size={18} />}
            gradient="bg-gradient-to-br from-primary-500 to-primary-700"
            subtitle={`${stats?.users.active || 0} active`}
            change={12}
          />
          <StatCard
            title="Active Modules"
            value={stats?.modules.active || 0}
            icon={<Layers size={18} />}
            gradient="bg-gradient-to-br from-violet-500 to-purple-700"
            subtitle={`${stats?.modules.total || 0} total`}
            change={5}
          />
          <StatCard
            title="Activities (30d)"
            value={stats?.activity.last30Days || 0}
            icon={<Activity size={18} />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
            change={23}
          />
          <StatCard
            title="Platform Health"
            value="99.9%"
            icon={<TrendingUp size={18} />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            subtitle="Uptime last 30 days"
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity area chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="System Activity" subtitle="Daily activity over the last 30 days" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChart || []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#actGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Module usage donut */}
        <Card>
          <CardHeader title="Module Usage" subtitle="Top modules" />
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={moduleUsage || []} dataKey="count" nameKey="module" cx="50%" cy="50%" outerRadius={60} innerRadius={34} paddingAngle={2}>
                  {(moduleUsage || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {(moduleUsage || []).slice(0, 4).map((item: { module: string; count: number }, i: number) => (
              <div key={item.module} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-xs text-surface-500 dark:text-surface-400 capitalize truncate flex-1">{item.module}</span>
                <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User growth */}
        <Card>
          <CardHeader title="User Growth" subtitle="New users per month" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth || []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: '#6366f110' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest system events" />
          <div className="space-y-2.5 max-h-52 overflow-y-auto no-scrollbar">
            {(recentActivity || []).slice(0, 8).map((activity: {
              id: string; action: string; module?: string; description?: string; createdAt: string;
              user?: { firstName: string; lastName: string };
            }) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0 mt-0.5">
                  {actionIconMap[activity.action] || <Activity size={13} className="text-surface-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-700 dark:text-surface-300 leading-relaxed">
                    <span className="font-semibold">{activity.user?.firstName} {activity.user?.lastName}</span>
                    {' '}{activity.description || `${activity.action} on ${activity.module}`}
                  </p>
                  <p className="text-[10px] text-surface-400 mt-0.5">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="default" size="sm">{activity.action}</Badge>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-xs text-surface-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
