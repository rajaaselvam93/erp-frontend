import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, UserCog, Settings, ChevronDown,
  ChevronRight, Package, TrendingUp, ShoppingCart, Clipboard,
  Headphones, BarChart3, DollarSign, X, Heart, Database,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar, closeMobileSidebar } from '../../store/appSlice';
import { useAuth } from '../../hooks/useAuth';

const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={18} />,
  'users': <Users size={18} />,
  'user-heart': <Heart size={18} />,
  'dollar-sign': <DollarSign size={18} />,
  'package': <Package size={18} />,
  'trending-up': <TrendingUp size={18} />,
  'shopping-cart': <ShoppingCart size={18} />,
  'clipboard': <Clipboard size={18} />,
  'headphones': <Headphones size={18} />,
  'bar-chart': <BarChart3 size={18} />,
  'settings': <Settings size={18} />,
  'database': <Database size={18} />,
  'user-cog': <UserCog size={18} />,
};

interface SidebarItemProps {
  name: string;
  path?: string;
  icon?: string;
  children?: SidebarItemProps[];
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps & { depth?: number }> = ({
  name, path, icon, children, collapsed, depth = 0,
}) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children && children.length > 0;
  const isActive = path ? location.pathname === path || location.pathname.startsWith(path + '/') : false;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
            'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
            'dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100',
            isActive && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
          )}
        >
          {icon && <span className="shrink-0">{iconMap[icon] || <Database size={18} />}</span>}
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{name}</span>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <div className="mt-1 ml-4 pl-3 border-l border-surface-100 dark:border-surface-800 space-y-1">
            {children.map((child) => (
              <SidebarItem key={child.name} {...child} depth={depth + 1} collapsed={false} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={path || '#'}
      title={collapsed ? name : undefined}
      className={({ isActive: navActive }) =>
        clsx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
          'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
          'dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100',
          navActive && 'bg-primary-50 !text-primary-700 dark:bg-primary-900/20 dark:!text-primary-400'
        )
      }
    >
      {icon && <span className="shrink-0">{iconMap[icon] || <Database size={18} />}</span>}
      {!collapsed && <span className="truncate">{name}</span>}
    </NavLink>
  );
};

const defaultNavItems: SidebarItemProps[] = [
  { name: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
  { name: 'HRMS', path: '/modules/hrm', icon: 'users' },
  { name: 'CRM', path: '/modules/crm', icon: 'user-heart' },
  { name: 'Finance', path: '/modules/finance', icon: 'dollar-sign' },
  { name: 'Inventory', path: '/modules/inventory', icon: 'package' },
  { name: 'Sales', path: '/modules/sales', icon: 'trending-up' },
  { name: 'Purchase', path: '/modules/purchase', icon: 'shopping-cart' },
  { name: 'Projects', path: '/modules/projects', icon: 'clipboard' },
  { name: 'Support', path: '/modules/support', icon: 'headphones' },
  { name: 'Reports', path: '/reports', icon: 'bar-chart' },
];

const adminItems: SidebarItemProps[] = [
  { name: 'Users', path: '/admin/users', icon: 'users' },
  { name: 'Roles', path: '/admin/roles', icon: 'user-cog' },
  { name: 'Modules', path: '/admin/modules', icon: 'database' },
  { name: 'Settings', path: '/settings', icon: 'settings' },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, sidebarMobileOpen } = useAppSelector((state) => state.app);
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white border-r border-surface-100 transition-all duration-300 ease-in-out',
          'dark:bg-surface-900 dark:border-surface-800',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
          'lg:translate-x-0',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-100 dark:border-surface-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="font-bold text-surface-900 dark:text-surface-50 truncate">Evvo ERP</div>
              <div className="text-xs text-surface-400">Enterprise Platform</div>
            </div>
          )}
          {sidebarMobileOpen && (
            <button
              onClick={() => dispatch(closeMobileSidebar())}
              className="ml-auto p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          {defaultNavItems.map((item) => (
            <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
          ))}

          {isAdmin && (
            <>
              <div className={clsx('pt-4 pb-2', !sidebarCollapsed && 'px-3')}>
                {!sidebarCollapsed ? (
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Administration</p>
                ) : (
                  <div className="border-t border-surface-100 dark:border-surface-800" />
                )}
              </div>
              {adminItems.map((item) => (
                <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
              ))}
            </>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-surface-100 dark:border-surface-800 hidden lg:block">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 transition-colors"
          >
            <ChevronRight
              size={16}
              className={clsx('transition-transform duration-300', !sidebarCollapsed && 'rotate-180')}
            />
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
