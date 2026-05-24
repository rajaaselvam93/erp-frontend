import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Sun, Moon, Monitor, User, LogOut, Settings, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleMobileSidebar } from '../../store/appSlice';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Badge from '../ui/Badge';
import type { Theme } from '../../types';

const themeOptions: { label: string; value: Theme; icon: React.ReactNode }[] = [
  { label: 'Light',  value: 'light',  icon: <Sun size={13} /> },
  { label: 'Dark',   value: 'dark',   icon: <Moon size={13} /> },
  { label: 'System', value: 'system', icon: <Monitor size={13} /> },
];

const Dropdown: React.FC<{
  open: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ open, className, children }) => {
  if (!open) return null;
  return (
    <div className={clsx(
      'absolute right-0 top-[calc(100%+6px)] z-50 animate-slide-down',
      'bg-white dark:bg-surface-900',
      'rounded-xl shadow-elevated border border-surface-100 dark:border-surface-800',
      'overflow-hidden min-w-[160px]',
      className
    )}>
      {children}
    </div>
  );
};

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, fullName, logout } = useAuth();
  const { theme, changeTheme, isDark } = useTheme();
  const { unreadCount, notifications, sidebarCollapsed } = useAppSelector((state) => state.app);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false); setThemeMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconBtn = clsx(
    'p-2 rounded-xl text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100',
    'hover:bg-surface-100/80 dark:hover:bg-surface-800/60 transition-all duration-150'
  );

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 z-30 h-[60px] flex items-center gap-2 px-4',
        'bg-white/90 backdrop-blur-md border-b border-surface-100/80',
        'dark:bg-surface-950/90 dark:border-surface-800/60',
        'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'left-0 lg:left-[252px]',
        sidebarCollapsed && 'lg:left-[70px]'
      )}
    >
      {/* Mobile hamburger */}
      <button onClick={() => dispatch(toggleMobileSidebar())} className={clsx(iconBtn, 'lg:hidden')}>
        <Menu size={18} />
      </button>

      {/* Search trigger */}
      <button
        className={clsx(
          'hidden sm:flex items-center gap-2 h-8 px-3 rounded-xl text-sm',
          'border border-surface-200 dark:border-surface-700/80',
          'bg-surface-50/80 dark:bg-surface-800/50',
          'text-surface-400 dark:text-surface-500',
          'hover:border-primary-300 hover:text-primary-600 dark:hover:border-primary-600 dark:hover:text-primary-400',
          'transition-all duration-150',
          'min-w-[180px]'
        )}
      >
        <Search size={13} />
        <span className="flex-1 text-left text-xs">Search…</span>
        <kbd className="text-[10px]">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <div className="relative" ref={themeRef}>
        <button
          onClick={() => { setThemeMenuOpen((v) => !v); setUserMenuOpen(false); setNotifOpen(false); }}
          className={iconBtn}
          title="Theme"
        >
          {isDark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <Dropdown open={themeMenuOpen} className="w-36">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { changeTheme(opt.value); setThemeMenuOpen(false); }}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors',
                'hover:bg-surface-50 dark:hover:bg-surface-800',
                theme === opt.value
                  ? 'text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-surface-600 dark:text-surface-400'
              )}
            >
              {opt.icon}<span className="flex-1 text-left">{opt.label}</span>
              {theme === opt.value && <Check size={12} />}
            </button>
          ))}
        </Dropdown>
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); setThemeMenuOpen(false); }}
          className={clsx(iconBtn, 'relative')}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-950" />
          )}
        </button>
        <Dropdown open={notifOpen} className="w-72 right-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            <span className="text-xs font-semibold text-surface-900 dark:text-surface-50">Notifications</span>
            {unreadCount > 0 && <Badge variant="primary" size="sm">{unreadCount} new</Badge>}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.slice(0, 5).length > 0 ? notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={clsx(
                'flex gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/60 cursor-pointer',
                !n.isRead && 'bg-primary-50/40 dark:bg-primary-900/10'
              )}>
                <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.isRead ? 'opacity-0' : 'bg-primary-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-surface-900 dark:text-surface-100 truncate">{n.title}</p>
                  {n.message && <p className="text-[11px] text-surface-500 truncate mt-0.5">{n.message}</p>}
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-xs text-surface-400">No notifications</div>
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-surface-100 dark:border-surface-800">
            <button
              onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
              className="w-full text-center text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              View all
            </button>
          </div>
        </Dropdown>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1 hidden sm:block" />

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => { setUserMenuOpen((v) => !v); setThemeMenuOpen(false); setNotifOpen(false); }}
          className={clsx(
            'flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl',
            'hover:bg-surface-100/80 dark:hover:bg-surface-800/60',
            'transition-all duration-150'
          )}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={fullName} className="w-7 h-7 rounded-full object-cover ring-2 ring-surface-200 dark:ring-surface-700" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-surface-800 dark:text-surface-200 leading-none">{fullName}</div>
            <div className="text-[10px] text-surface-400 mt-0.5">{user?.role?.name}</div>
          </div>
          <ChevronDown size={12} className="text-surface-400 hidden sm:block" />
        </button>

        <Dropdown open={userMenuOpen && !themeMenuOpen} className="w-52">
          <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            <p className="text-xs font-semibold text-surface-900 dark:text-surface-50">{fullName}</p>
            <p className="text-[11px] text-surface-400 mt-0.5 truncate">{user?.email}</p>
          </div>
          {[
            { label: 'Profile',  icon: <User size={13} />,     path: '/profile' },
            { label: 'Settings', icon: <Settings size={13} />, path: '/settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setUserMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors"
            >
              <span className="text-surface-400">{item.icon}</span>{item.label}
            </button>
          ))}
          <div className="border-t border-surface-100 dark:border-surface-800">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <LogOut size={13} />Sign out
            </button>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
