import api from './api.service';
import type { User } from '../types';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password, confirmPassword });
  },

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
  },
};
