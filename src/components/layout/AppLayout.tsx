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

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser()).then(() => {
        queryClient.invalidateQueries({ queryKey: ['menu-tree'] });
      });
    }
  }, [isAuthenticated, user, dispatch, queryClient]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#0d0d0f]">
      <Sidebar />
      <Header />

      <main
        className={clsx(
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pt-[60px]',
          'lg:ml-[252px]',
          sidebarCollapsed && 'lg:ml-[70px]'
        )}
      >
        <div className="p-5 sm:p-6 min-h-[calc(100vh-60px)] animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
