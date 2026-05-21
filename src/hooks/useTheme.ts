import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setTheme } from '../store/appSlice';
import type { Theme } from '../types';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.app.theme);

  useEffect(() => {
    const applyTheme = (t: Theme) => {
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const changeTheme = (newTheme: Theme) => {
    dispatch(setTheme(newTheme));
  };

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return { theme, changeTheme, isDark };
};
