import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppSelector } from '../../store';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../hooks/useSocket';
import { useTheme } from '../../hooks/useTheme';

const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useAppSelector((state) => state.app);
  useSocket();
  useTheme();

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
