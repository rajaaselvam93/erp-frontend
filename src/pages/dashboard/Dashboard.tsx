import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Layers, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../../services/api.service';
import { Card, CardHeader } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: number;
  subtitle?: string;
}> = ({ title, value, icon, color, change, subtitle }) => (
  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
        <p className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-surface-400 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change)}% from last month
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white`} style={{ backgroundColor: color }}>
        {icon}
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user, fullName } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
  });

  const { data: activityChart } = useQuery({
    queryKey: ['activity-chart'],
    queryFn: async () => {
      const res = await api.get('/dashboard/activity-chart', { params: { days: 30 } });
      return res.data.data;
    },
  });

  const { data: moduleUsage } = useQuery({
    queryKey: ['module-usage'],
    queryFn: async () => {
      const res = await api.get('/dashboard/module-usage');
      return res.data.data;
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await api.get('/dashboard/activity', { params: { limit: 10 } });
      return res.data.data;
    },
  });

  const { data: userGrowth } = useQuery({
    queryKey: ['user-growth'],
    queryFn: async () => {
      const res = await api.get('/dashboard/user-growth', { params: { months: 6 } });
      return res.data.data;
    },
  });

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const actionIconMap: Record<string, React.ReactNode> = {
    create: <CheckCircle size={14} className="text-emerald-500" />,
    update: <TrendingUp size={14} className="text-blue-500" />,
    delete: <Activity size={14} className="text-red-500" />,
    login: <Clock size={14} className="text-purple-500" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          {getTimeGreeting()}, {user?.firstName}!
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Here's what's happening in your workspace today.
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-surface-200 rounded w-1/2" />
                <div className="h-8 bg-surface-200 rounded w-1/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats?.users.total || 0}
            icon={<Users size={20} />}
            color="#6366f1"
            subtitle={`${stats?.users.active || 0} active`}
            change={12}
          />
          <StatCard
            title="Active Modules"
            value={stats?.modules.active || 0}
            icon={<Layers size={20} />}
            color="#8b5cf6"
            subtitle={`${stats?.modules.total || 0} total`}
            change={5}
          />
          <StatCard
            title="Activities (30d)"
            value={stats?.activity.last30Days || 0}
            icon={<Activity size={20} />}
            color="#10b981"
            change={23}
          />
          <StatCard
            title="Platform Health"
            value="99.9%"
            icon={<TrendingUp size={20} />}
            color="#f59e0b"
            subtitle="Uptime last 30 days"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="System Activity" subtitle="Daily activities over the last 30 days" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChart || []}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#activityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Module Usage Pie */}
        <Card>
          <CardHeader title="Module Usage" subtitle="Most used modules" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moduleUsage || []}
                  dataKey="count"
                  nameKey="module"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                >
                  {(moduleUsage || []).map((_: unknown, index: number) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {(moduleUsage || []).slice(0, 4).map((item: { module: string; count: number }, index: number) => (
              <div key={item.module} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="text-xs text-surface-600 dark:text-surface-400 capitalize truncate flex-1">{item.module}</span>
                <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <Card>
          <CardHeader title="User Growth" subtitle="New users by month" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest system events" />
          <div className="space-y-3 max-h-52 overflow-y-auto no-scrollbar">
            {(recentActivity || []).slice(0, 8).map((activity: {
              id: string;
              action: string;
              module?: string;
              description?: string;
              createdAt: string;
              user?: { firstName: string; lastName: string; avatar?: string };
            }) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                  {actionIconMap[activity.action] || <Activity size={14} className="text-surface-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700 dark:text-surface-300 truncate">
                    <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>
                    {' '}{activity.description || `${activity.action} on ${activity.module}`}
                  </p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant="default" size="sm">{activity.action}</Badge>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <p className="text-sm text-surface-400 text-center py-8">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
