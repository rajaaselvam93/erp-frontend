import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Search, Sun, Moon, Monitor,
  User, LogOut, Settings, ChevronDown, Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleMobileSidebar } from '../../store/appSlice';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Badge from '../ui/Badge';
import type { Theme } from '../../types';

const themeOptions: { label: string; value: Theme; icon: React.ReactNode }[] = [
  { label: 'Light', value: 'light', icon: <Sun size={14} /> },
  { label: 'Dark', value: 'dark', icon: <Moon size={14} /> },
  { label: 'System', value: 'system', icon: <Monitor size={14} /> },
];

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, fullName, logout } = useAuth();
  const { theme, changeTheme, isDark } = useTheme();
  const { unreadCount, notifications } = useAppSelector((state) => state.app);
  const { sidebarCollapsed } = useAppSelector((state) => state.app);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setThemeMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 z-30 h-16 flex items-center gap-3 px-4 bg-white border-b border-surface-100 transition-all duration-300',
        'dark:bg-surface-900 dark:border-surface-800',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]',
        'lg:left-auto',
        'w-full lg:w-auto'
      )}
      style={{
        left: undefined,
        width: '100%',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={() => dispatch(toggleMobileSidebar())}
        className="lg:hidden p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-surface-200 text-surface-400 text-sm hover:border-primary-300 hover:text-primary-600 transition-all dark:border-surface-700 dark:hover:border-primary-500"
        style={{ minWidth: 200 }}
      >
        <Search size={14} />
        <span>Search anything...</span>
        <kbd className="ml-auto text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-surface-400">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* Theme Toggle */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => { setThemeMenuOpen((v) => !v); setUserMenuOpen(false); }}
          className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 transition-colors"
          title="Change theme"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {themeMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-surface-900 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-800 overflow-hidden animate-scale-in z-50">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { changeTheme(opt.value); setThemeMenuOpen(false); }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800',
                  theme === opt.value && 'text-primary-600 dark:text-primary-400'
                )}
              >
                {opt.icon}
                <span>{opt.label}</span>
                {theme === opt.value && <Check size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((v) => !v); }}
          className="relative p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-surface-900 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-800 overflow-hidden animate-scale-in z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <span className="text-sm font-semibold text-surface-900 dark:text-surface-50">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="primary">{unreadCount} new</Badge>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.slice(0, 5).length > 0 ? (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className={clsx('flex gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer', !n.isRead && 'bg-primary-50/30 dark:bg-primary-900/10')}>
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0 opacity-0" style={{ opacity: n.isRead ? 0 : 1 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{n.title}</p>
                      {n.message && <p className="text-xs text-surface-500 truncate mt-0.5">{n.message}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-surface-400">No notifications</div>
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-surface-100 dark:border-surface-800">
              <button onClick={() => { navigate('/notifications'); setNotifOpen(false); }} className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => { setUserMenuOpen((v) => !v); setThemeMenuOpen(false); }}
          className="flex items-center gap-2.5 pl-2 pr-3 py-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm dark:bg-primary-900/30 dark:text-primary-400">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-surface-800 dark:text-surface-200 leading-none">{fullName}</div>
            <div className="text-xs text-surface-400 mt-0.5">{user?.role?.name}</div>
          </div>
          <ChevronDown size={14} className="text-surface-400 hidden sm:block" />
        </button>

        {userMenuOpen && !themeMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-surface-900 rounded-xl shadow-elevated border border-surface-100 dark:border-surface-800 overflow-hidden animate-scale-in z-50">
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{fullName}</p>
              <p className="text-xs text-surface-400 mt-0.5 truncate">{user?.email}</p>
            </div>
            {[
              { label: 'Profile', icon: <User size={14} />, path: '/profile' },
              { label: 'Settings', icon: <Settings size={14} />, path: '/settings' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => { navigate(item.path); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="border-t border-surface-100 dark:border-surface-800 mt-1">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
