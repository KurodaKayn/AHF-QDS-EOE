'use client';

import { useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useThemeStore } from '@/store/themeStore';

/**
 * 主题切换按钮
 */
export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useThemeStore();

  // 在客户端应用主题
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? (
        <FaMoon className="text-gray-700" size={16} />
      ) : (
        <FaSun className="text-yellow-300" size={16} />
      )}
    </button>
  );
} 