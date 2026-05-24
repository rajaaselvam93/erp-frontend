import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchCurrentUser } from '../../store/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';

const AppLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { sidebarCollapsed } = useAppSelector((state) => state.app);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  useSocket();
  useTheme();

  // On page load/refresh: tokens exist in localStorage but user object is null.
  // Hydrate Redux, then invalidate the menu cache so Sidebar re-fetches with
  // the now-authenticated context (backend filter uses the JWT, not Redux state).
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser()).then(() => {
        queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      });
    }
  }, [isAuthenticated, user, dispatch, queryClient]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <Header />

      {/* Main Content */}
      <main
        className={clsx(
          'transition-all duration-300 ease-in-out pt-16',
          'lg:ml-[260px]',
          sidebarCollapsed && 'lg:ml-[72px]'
        )}
      >
        <div className="p-4 sm:p-6 min-h-[calc(100vh-64px)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
