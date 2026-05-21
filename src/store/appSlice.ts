import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppState, Theme, Module, Notification } from '../types';

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme') as Theme;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState: AppState = {
  theme: getInitialTheme(),
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  sidebarMobileOpen: false,
  currentModule: null,
  notifications: [],
  unreadCount: 0,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);

      const isDark =
        action.payload === 'dark' ||
        (action.payload === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      document.documentElement.classList.toggle('dark', isDark);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', String(action.payload));
    },
    toggleMobileSidebar: (state) => {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },
    closeMobileSidebar: (state) => {
      state.sidebarMobileOpen = false;
    },
    setCurrentModule: (state, action: PayloadAction<Module | null>) => {
      state.currentModule = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    setNotifications: (state, action: PayloadAction<{ notifications: Notification[]; unreadCount: number }>) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  closeMobileSidebar,
  setCurrentModule,
  addNotification,
  setNotifications,
  markNotificationRead,
  clearAllNotifications,
} = appSlice.actions;

export default appSlice.reducer;
