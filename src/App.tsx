import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAppSelector } from './store';
import { useTheme } from './hooks/useTheme';
import { PageLoader } from './components/ui/LoadingSpinner';
import AppLayout from './components/layout/AppLayout';

// Lazy loaded pages
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const DynamicModule = lazy(() => import('./pages/modules/DynamicModule'));
const Modules = lazy(() => import('./pages/admin/Modules'));
const Users = lazy(() => import('./pages/admin/Users'));
const Roles = lazy(() => import('./pages/admin/Roles'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const ModuleFields = lazy(() => import('./pages/admin/ModuleFields'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

// Admin-only route wrapper — non-admins are redirected to dashboard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const roleSlug = user?.role?.slug;
  if (roleSlug !== 'admin' && roleSlug !== 'super-admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Auth route wrapper (redirect if already authenticated)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  useTheme();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected App Routes */}
          <Route
            path="/"
            element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />

            {/* Dynamic module pages */}
            <Route path="modules/:slug" element={<DynamicModule />} />

            {/* Admin-only pages */}
            <Route path="admin/users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="admin/roles" element={<AdminRoute><Roles /></AdminRoute>} />
            <Route path="admin/modules" element={<AdminRoute><Modules /></AdminRoute>} />
            <Route path="admin/modules/:id/fields" element={<AdminRoute><ModuleFields /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="rounded-xl shadow-elevated"
      />
    </BrowserRouter>
  );
};

export default App;
