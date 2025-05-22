'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserSettingsData, defaultSettings } from '@/lib/userSettings';

/**
 * 用户设置钩子，用于在客户端获取和更新用户设置
 */
export function useUserSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取设置
  const fetchSettings = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取设置失败');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      console.error('获取设置失败:', err);
      setError(err.message || '获取设置失败');
      // 出错时使用默认设置
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // 更新设置
  const updateSettings = useCallback(async (newSettings: Partial<UserSettingsData>) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新设置失败');
      }
      
      const data = await response.json();
      setSettings(data);
      return true;
    } catch (err: any) {
      console.error('更新设置失败:', err);
      setError(err.message || '更新设置失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // 更新单个设置项
  const updateSetting = useCallback(async <K extends keyof UserSettingsData>(
    key: K, 
    value: UserSettingsData[K]
  ) => {
    return updateSettings({ [key]: value } as Partial<UserSettingsData>);
  }, [updateSettings]);

  // 重置设置
  const resetSettings = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重置设置失败');
      }
      
      const data = await response.json();
      setSettings(data);
      return true;
    } catch (err: any) {
      console.error('重置设置失败:', err);
      setError(err.message || '重置设置失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // 用户已认证时加载设置
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettings();
    } else if (status === 'unauthenticated') {
      setSettings(defaultSettings);
      setIsLoading(false);
    }
  }, [status, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSetting,
    resetSettings,
    isReady: !isLoading && status !== 'loading'
  };
} 