import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, UserCog, Settings, ChevronDown,
  ChevronRight, BarChart2, X, Database, Building2, Briefcase,
  ShoppingCart, Package, DollarSign, UserCheck, ChevronLeft,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar, closeMobileSidebar } from '../../store/appSlice';
import { useAuth } from '../../hooks/useAuth';

const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={16} />,
  'users':            <Users size={16} />,
  'database':         <Database size={16} />,
  'bar-chart-2':      <BarChart2 size={16} />,
  'settings':         <Settings size={16} />,
  'user-cog':         <UserCog size={16} />,
  'user-check':       <UserCheck size={16} />,
  'building':         <Building2 size={16} />,
  'briefcase':        <Briefcase size={16} />,
  'shopping-cart':    <ShoppingCart size={16} />,
  'package':          <Package size={16} />,
  'dollar-sign':      <DollarSign size={16} />,
};

// Per-module accent colors for icon backgrounds
const iconColors: Record<string, string> = {
  '/dashboard':   'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  '/hrms':        'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  '/crm':         'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  '/procurement': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  '/inventory':   'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  '/sales':       'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  '/finance':     'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  '/projects':    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  '/reports':     'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  // admin
  '/admin/users': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  '/admin/roles': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  '/admin/modules':'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  '/settings':    'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
};

const renderIcon = (icon?: string) => icon ? (iconMap[icon] ?? <Database size={16} />) : <Database size={16} />;

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

  const accentClass = path ? (iconColors[path] ?? 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400') : '';

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={clsx(
            'w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150',
            'text-surface-600 hover:bg-surface-100/80 hover:text-surface-900',
            'dark:text-surface-400 dark:hover:bg-surface-800/60 dark:hover:text-surface-100',
            isActive && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
          )}
        >
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{name}</span>
              <ChevronDown size={13} className={clsx('transition-transform duration-200 shrink-0', expanded && 'rotate-180')} />
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <div className="mt-0.5 ml-3 pl-3 border-l border-surface-100 dark:border-surface-800 space-y-0.5">
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
          'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150',
          navActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
            : 'text-surface-600 hover:bg-surface-100/80 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/60 dark:hover:text-surface-100'
        )
      }
    >
      {({ isActive: navActive }) => (
        <>
          <span className={clsx(
            'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150',
            navActive ? accentClass : 'text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-400'
          )}>
            {renderIcon(icon)}
          </span>
          {!collapsed && <span className="truncate">{name}</span>}
          {!collapsed && navActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
          )}
        </>
      )}
    </NavLink>
  );
};

const staticTop: NavItemDef[] = [
  { name: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
];

const erpModules: NavItemDef[] = [
  { name: 'HRMS',        path: '/hrms',        icon: 'user-check' },
  { name: 'CRM',         path: '/crm',         icon: 'users' },
  { name: 'Procurement', path: '/procurement', icon: 'building' },
  { name: 'Inventory',   path: '/inventory',   icon: 'package' },
  { name: 'Sales',       path: '/sales',       icon: 'shopping-cart' },
  { name: 'Finance',     path: '/finance',     icon: 'dollar-sign' },
  { name: 'Projects',    path: '/projects',    icon: 'briefcase' },
  { name: 'Reports & BI', path: '/reports',   icon: 'bar-chart-2' },
];

const adminItems: NavItemDef[] = [
  { name: 'Users',    path: '/admin/users',    icon: 'users' },
  { name: 'Roles',    path: '/admin/roles',    icon: 'user-cog' },
  { name: 'Modules',  path: '/admin/modules',  icon: 'database' },
  { name: 'Settings', path: '/settings',       icon: 'settings' },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, sidebarMobileOpen } = useAppSelector((state) => state.app);
  const { isAdmin } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-50 flex flex-col',
          'bg-white border-r border-surface-100/80',
          'dark:bg-surface-950 dark:border-surface-800/60',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarCollapsed ? 'w-[70px]' : 'w-[252px]',
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-[60px] border-b border-surface-100/80 dark:border-surface-800/60 shrink-0',
          sidebarCollapsed ? 'px-[17px]' : 'px-4'
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-500/30 shrink-0">
              <span className="text-white font-bold text-base">E</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-bold text-sm text-surface-900 dark:text-surface-50 truncate leading-none">Evvo ERP</div>
                <div className="text-[10px] text-surface-400 dark:text-surface-500 mt-0.5">Enterprise Platform</div>
              </div>
            )}
          </div>
          {sidebarMobileOpen && !sidebarCollapsed && (
            <button
              onClick={() => dispatch(closeMobileSidebar())}
              className="ml-auto p-1 rounded-lg text-surface-400 hover:bg-surface-100 lg:hidden"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 no-scrollbar">
          {staticTop.map((item) => (
            <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
          ))}

          {/* Business Modules */}
          <div className="pt-4 pb-1">
            {!sidebarCollapsed ? (
              <p className="section-label">Business Modules</p>
            ) : (
              <div className="border-t border-surface-100 dark:border-surface-800 mx-1" />
            )}
          </div>
          {erpModules.map((item) => (
            <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
          ))}

          {/* Administration */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1">
                {!sidebarCollapsed ? (
                  <p className="section-label">Administration</p>
                ) : (
                  <div className="border-t border-surface-100 dark:border-surface-800 mx-1" />
                )}
              </div>
              {adminItems.map((item) => (
                <SidebarItem key={item.name} {...item} collapsed={sidebarCollapsed} />
              ))}
            </>
          )}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2.5 border-t border-surface-100/80 dark:border-surface-800/60 hidden lg:block">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={clsx(
              'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium',
              'text-surface-400 hover:bg-surface-100/80 hover:text-surface-600',
              'dark:text-surface-500 dark:hover:bg-surface-800/60 dark:hover:text-surface-400',
              'transition-all duration-150',
              sidebarCollapsed && 'justify-center'
            )}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
