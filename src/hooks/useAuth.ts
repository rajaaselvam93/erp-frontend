import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { loginThunk, logoutThunk } from '../store/authSlice';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, accessToken } = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(loginThunk({ email, password }));
      if (loginThunk.fulfilled.match(result)) {
        toast.success('Welcome back!');
        navigate('/dashboard');
        return true;
      } else {
        toast.error(result.payload as string || 'Login failed');
        return false;
      }
    },
    [dispatch, navigate]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
    navigate('/auth/login');
    toast.info('Logged out successfully');
  }, [dispatch, navigate]);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      const roleSlug = user.role?.slug;
      if (roleSlug === 'super-admin' || roleSlug === 'admin') return true;
      // User-level extra permissions (JSON column)
      const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
      if (userPerms.includes('*') || userPerms.includes(permission)) return true;
      // Role permissions (eager-loaded Permission objects)
      const rolePerms = (user.role?.permissions || [])
        .map((p) => p.slug)
        .filter(Boolean);
      return rolePerms.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user?.role) return false;
      return roles.includes(user.role.slug);
    },
    [user]
  );

  const isAdmin = hasRole('admin', 'super-admin');
  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    login,
    logout,
    hasPermission,
    hasRole,
    isAdmin,
    fullName,
  };
};
