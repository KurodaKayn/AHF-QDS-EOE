"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import { useThemeStore } from "@/store/themeStore";

/**
 * 主题初始化组件
 * 负责从quizStore获取主题设置并应用到DOM
 */
const ThemeInitializer = () => {
  const { settings } = useQuizStore();
  const { setTheme } = useThemeStore();

  useEffect(() => {
    // 从quizStore获取主题设置并应用
    const theme = settings.theme;
    
    if (theme === 'system') {
      // 检测系统主题
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(systemTheme);
    } else {
      // 直接应用用户选择的主题
      setTheme(theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme, setTheme]);

  return null;
};

/**
 * API密钥设置初始化组件
 * 负责在应用启动时从localStorage加载API密钥设置到QuizStore
 */
const SettingsInitializer = () => {
  const { setQuizSetting } = useQuizStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('apiKeySettings');
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          
          // 同时更新quizStore中的API设置
          setQuizSetting('aiProvider', parsedSettings.provider);
          setQuizSetting('deepseekApiKey', parsedSettings.deepseekApiKey);
          setQuizSetting('deepseekBaseUrl', parsedSettings.deepseekBaseUrl);
          setQuizSetting('alibabaApiKey', parsedSettings.alibabaApiKey);
        } catch (e) {
          console.error('解析存储的 API 密钥设置时出错:', e);
        }
      }
    }
  }, [setQuizSetting]);

  return null;
};

/**
 * 应用提供者包装器
 * 包含NextAuth会话提供者和各种初始化组件
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeInitializer />
      <SettingsInitializer />
      {children}
    </SessionProvider>
  );
} 