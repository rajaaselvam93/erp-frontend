import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, UserCog, Settings, ChevronDown,
  ChevronRight, BarChart3, X, Database, Building2, Briefcase,
  ShoppingCart, Package, DollarSign, UserCheck, BarChart2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar, closeMobileSidebar } from '../../store/appSlice';
import { useAuth } from '../../hooks/useAuth';
import { moduleService } from '../../services/module.service';
import type { MenuItem } from '../../types';

// Actions checked when deciding whether to show a module in the sidebar
const MODULE_ACTIONS = ['read', 'create', 'update', 'delete', 'export', 'import'] as const;

// Map icon names stored in the DB to Lucide components
const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={18} />,
  'users': <Users size={18} />,
  'database': <Database size={18} />,
  'bar-chart': <BarChart3 size={18} />,
  'bar-chart-2': <BarChart2 size={18} />,
  'settings': <Settings size={18} />,
  'user-cog': <UserCog size={18} />,
  'user-check': <UserCheck size={18} />,
  'building': <Building2 size={18} />,
  'briefcase': <Briefcase size={18} />,
  'shopping-cart': <ShoppingCart size={18} />,
  'package': <Package size={18} />,
  'dollar-sign': <DollarSign size={18} />,
};

const renderIcon = (icon?: string) => icon ? (iconMap[icon] ?? <Database size={18} />) : <Database size={18} />;

interface NavItemDef {
  name: string;
  path?: string;
  icon?: string;
  children?: NavItemDef[];
}

const SidebarItem: React.FC<NavItemDef & { collapsed?: boolean; depth?: number }> = ({
  name, path, icon, children, collapsed, depth = 0,
}) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children && children.length > 0;
  const isActive = path
    ? location.pathname === path || location.pathname.startsWith(path + '/')
    : false;

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
          <span className="shrink-0">{renderIcon(icon)}</span>
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
      <span className="shrink-0">{renderIcon(icon)}</span>
      {!collapsed && <span className="truncate">{name}</span>}
    </NavLink>
  );
};

// Convert API MenuItem to NavItemDef
const menuItemToNav = (item: MenuItem): NavItemDef => ({
  name: item.name,
  path: item.path,
  icon: item.icon ?? 'database',
  children: item.children?.map(menuItemToNav),
});

const staticTop: NavItemDef[] = [
  { name: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
];

const erpModules: NavItemDef[] = [
  { name: 'HRMS', path: '/hrms', icon: 'user-check' },
  { name: 'CRM', path: '/crm', icon: 'users' },
  { name: 'Procurement', path: '/procurement', icon: 'building' },
  { name: 'Inventory', path: '/inventory', icon: 'package' },
  { name: 'Sales', path: '/sales', icon: 'shopping-cart' },
  { name: 'Finance', path: '/finance', icon: 'dollar-sign' },
  { name: 'Projects', path: '/projects', icon: 'briefcase' },
];

const staticBottom: NavItemDef[] = [
  { name: 'Reports & BI', path: '/reports', icon: 'bar-chart-2' },
];

const adminItems: NavItemDef[] = [
  { name: 'Users', path: '/admin/users', icon: 'users' },
  { name: 'Roles', path: '/admin/roles', icon: 'user-cog' },
  { name: 'Modules', path: '/admin/modules', icon: 'database' },
  { name: 'Settings', path: '/settings', icon: 'settings' },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, sidebarMobileOpen } = useAppSelector((state) => state.app);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user, isAdmin, hasPermission } = useAuth();

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-tree'],
    queryFn: () => moduleService.getMenuTree(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 s — refresh after module changes
  });

  // Frontend safety-net: filter dynamic menu items by the user's permissions.
  // Skip the filter when user is null (page-refresh hydration window) — the backend
  // already filtered the menu response, so trust it until user loads into Redux.
  const dynamicNavItems: NavItemDef[] = menuItems
    .filter((item) => {
      if (!user) return true; // hydrating — trust backend-filtered response
      if (isAdmin) return true;
      // Extract the module slug from paths of the form /modules/{slug}
      const match = item.path?.match(/^\/modules\/([^/]+)/);
      if (!match) return true; // non-module path — always show
      const moduleSlug = match[1];
      return MODULE_ACTIONS.some((action) => hasPermission(`${moduleSlug}.${action}`));
    })
    .map(menuItemToNav);

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
          {/* Always-visible top items */}
          {staticTop.map((item) => (
            <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
          ))}

          {/* ERP Business Modules */}
          <div className={clsx('pt-4 pb-2', !sidebarCollapsed && 'px-3')}>
            {!sidebarCollapsed ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Business Modules</p>
            ) : (
              <div className="border-t border-surface-100 dark:border-surface-800" />
            )}
          </div>
          {erpModules.map((item) => (
            <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
          ))}

          {/* Dynamic modules from API */}
          {dynamicNavItems.length > 0 && (
            <>
              <div className={clsx('pt-4 pb-2', !sidebarCollapsed && 'px-3')}>
                {!sidebarCollapsed ? (
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Custom Modules</p>
                ) : (
                  <div className="border-t border-surface-100 dark:border-surface-800" />
                )}
              </div>
              {dynamicNavItems.map((item) => (
                <SidebarItem key={item.name + item.path} {...item} collapsed={sidebarCollapsed} />
              ))}
            </>
          )}

          {/* Always-visible bottom items */}
          {staticBottom.map((item) => (
            <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
          ))}

          {/* Admin section */}
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
