'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserSettingsData, defaultSettings } from '@/lib/userSettings';
import { useQuizStore } from '@/hooks/useQuizStore';

/**
 * 用户设置管理Hook，提供获取、更新、重置等功能
 * 
 * 用法：
 *   const { settings, isLoading, error, updateSettings, updateSetting, resetSettings, isReady } = useUserSettings();
 *   - settings: 当前用户的所有设置（含默认值补全）
 *   - isLoading: 是否正在加载/保存
 *   - error: 错误信息
 *   - updateSettings: 批量更新设置
 *   - updateSetting: 更新单个设置项
 *   - resetSettings: 重置为默认设置
 *   - isReady: 是否已完成初始化
 *
 * 适用场景：
 *   1. 需要获取和展示用户个性化设置的页面
 *   2. 需要修改/保存用户设置的表单或交互
 *   3. 需要重置用户设置为默认值的场景
 * 
 * 数据流：
 *   1. 初始化时从API获取用户设置
 *   2. 更新时通过API保存到后端
 *   3. 所有操作都会更新本地状态
 *   4. 未登录用户使用默认设置
 */
export function useUserSettings() {
  // 获取用户会话信息，用于判断认证状态
  const { data: session, status } = useSession();
  
  // settings: 当前用户的所有设置，类型为UserSettingsData，初始为默认值
  const [settings, setSettings] = useState<UserSettingsData>(defaultSettings);
  
  // isLoading: 标记当前是否在加载或保存设置
  const [isLoading, setIsLoading] = useState(true);
  
  // error: 记录最近一次操作的错误信息
  const [error, setError] = useState<string | null>(null);

  // 获取QuizStore的setQuizSetting方法
  const { setQuizSetting } = useQuizStore();

  /**
   * 获取当前用户的设置（从后端API）
   *
   * 逻辑：
   *   1. 如果未认证，直接用默认设置
   *   2. 已认证则请求 /api/settings，获取用户设置
   *   3. 请求失败时，回退到默认设置并记录错误
   *   4. 设置加载完成后同步到QuizStore
   *
   * 异常处理：
   *   - 网络或API错误时，error会有提示，settings为默认值
   *   - 认证失败时使用默认设置
   * 
   * @returns {Promise<void>} 无返回值，直接更新内部状态
   */
  const fetchSettings = useCallback(async () => {
    // 如果用户未认证或没有用户ID，使用默认设置
    if (status !== 'authenticated' || !session?.user?.id) {
      setSettings(defaultSettings);
      setIsLoading(false);
      // 同步默认设置到QuizStore
      syncSettingsToQuizStore(defaultSettings);
      return;
    }

    try {
      // 开始加载，清除之前的错误
      setIsLoading(true);
      setError(null);
      
      // 发送API请求获取用户设置
      const response = await fetch('/api/settings');
      
      // 处理API错误响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取设置失败');
      }
      
      // 解析响应数据并更新设置状态
      const data = await response.json();
      setSettings(data);
      
      // 同步用户设置到QuizStore
      syncSettingsToQuizStore(data);
    } catch (err: any) {
      // 记录错误日志和状态
      console.error('获取设置失败:', err);
      setError(err.message || '获取设置失败');
      // 出错时使用默认设置
      setSettings(defaultSettings);
      // 同步默认设置到QuizStore
      syncSettingsToQuizStore(defaultSettings);
    } finally {
      // 无论成功失败，都结束加载状态
      setIsLoading(false);
    }
  }, [session?.user?.id, status, setQuizSetting]);

  /**
   * 将用户设置同步到QuizStore
   * 
   * @param settingsData 要同步的设置数据
   */
  const syncSettingsToQuizStore = useCallback((settingsData: UserSettingsData) => {
    // 同步设置到QuizStore
    setQuizSetting('theme', settingsData.theme);
    setQuizSetting('shufflePracticeOptions', settingsData.shufflePracticeOptions);
    setQuizSetting('shuffleReviewOptions', settingsData.shuffleReviewOptions);
    setQuizSetting('shufflePracticeQuestionOrder', settingsData.shufflePracticeQuestionOrder);
    setQuizSetting('shuffleReviewQuestionOrder', settingsData.shuffleReviewQuestionOrder);
    setQuizSetting('markMistakeAsCorrectedOnReviewSuccess', settingsData.markMistakeAsCorrectedOnReviewSuccess);
    setQuizSetting('checkDuplicateQuestion', settingsData.checkDuplicateQuestion);
    setQuizSetting('showDetailedExplanations', settingsData.showDetailedExplanations);
    setQuizSetting('autoContinue', settingsData.autoContinue);
  }, [setQuizSetting]);

  /**
   * 批量更新用户设置（部分字段）
   *
   * @param newSettings 需要更新的设置项（部分字段）
   * @returns Promise<boolean> 是否成功
   *
   * 逻辑：
   *   1. 仅认证用户可用
   *   2. PUT /api/settings，body为要更新的字段
   *   3. 成功后自动刷新settings
   *   4. 失败时error有提示
   *   5. 同步更新的设置到QuizStore
   * 
   * 异常处理：
   *   - 未认证时直接返回false
   *   - API错误时记录错误信息并返回false
   */
  const updateSettings = useCallback(async (newSettings: Partial<UserSettingsData>) => {
    // 验证用户是否已认证
    if (status !== 'authenticated' || !session?.user?.id) {
      return false;
    }

    try {
      // 开始加载，清除之前的错误
      setIsLoading(true);
      setError(null);
      
      // 发送API请求更新设置
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      // 处理API错误响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新设置失败');
      }
      
      // 解析响应数据并更新设置状态
      const data = await response.json();
      setSettings(data);
      
      // 同步更新的设置到QuizStore
      // 只同步本次更新的设置项
      Object.keys(newSettings).forEach(key => {
        const settingKey = key as keyof UserSettingsData;
        const settingValue = data[settingKey];
        if (settingValue !== undefined) {
          setQuizSetting(settingKey as any, settingValue as any);
        }
      });
      
      return true;
    } catch (err: any) {
      // 记录错误日志和状态
      console.error('更新设置失败:', err);
      setError(err.message || '更新设置失败');
      return false;
    } finally {
      // 无论成功失败，都结束加载状态
      setIsLoading(false);
    }
  }, [session?.user?.id, status, setQuizSetting]);

  /**
   * 更新单个设置项
   *
   * @param key 设置项的键名
   * @param value 新的值
   * @returns Promise<boolean> 是否成功
   *
   * 逻辑：
   *   1. 仅认证用户可用
   *   2. 内部调用updateSettings，仅更新一个字段
   *   3. 将单个键值对转换为部分设置对象
   * 
   * 泛型参数：
   *   K - UserSettingsData的键类型，确保类型安全
   */
  const updateSetting = useCallback(async <K extends keyof UserSettingsData>(
    key: K, 
    value: UserSettingsData[K]
  ) => {
    return updateSettings({ [key]: value } as Partial<UserSettingsData>);
  }, [updateSettings]);

  /**
   * 重置用户设置为默认值
   *
   * @returns Promise<boolean> 是否成功
   *
   * 逻辑：
   *   1. 仅认证用户可用
   *   2. DELETE /api/settings，重置为defaultSettings
   *   3. 成功后settings为默认值
   *   4. 失败时error有提示
   *   5. 同步重置的设置到QuizStore
   * 
   * 异常处理：
   *   - 未认证时直接返回false
   *   - API错误时记录错误信息并返回false
   */
  const resetSettings = useCallback(async () => {
    // 验证用户是否已认证
    if (status !== 'authenticated' || !session?.user?.id) {
      return false;
    }

    try {
      // 开始加载，清除之前的错误
      setIsLoading(true);
      setError(null);
      
      // 发送API请求重置设置
      const response = await fetch('/api/settings', {
        method: 'DELETE',
      });
      
      // 处理API错误响应
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '重置设置失败');
      }
      
      // 解析响应数据并更新设置状态
      const data = await response.json();
      setSettings(data);
      
      // 同步重置的设置到QuizStore
      syncSettingsToQuizStore(data);
      
      return true;
    } catch (err: any) {
      // 记录错误日志和状态
      console.error('重置设置失败:', err);
      setError(err.message || '重置设置失败');
      return false;
    } finally {
      // 无论成功失败，都结束加载状态
      setIsLoading(false);
    }
  }, [session?.user?.id, status, setQuizSetting, syncSettingsToQuizStore]);

  /**
   * 监听用户认证状态变化，自动加载或重置设置
   *
   * 逻辑：
   *   1. 认证后自动拉取设置
   *   2. 未认证时重置为默认设置
   *   3. 认证状态变化时重新获取数据
   */
  useEffect(() => {
    if (status === 'authenticated') {
      // 用户已认证，获取个人设置
      fetchSettings();
    } else if (status === 'unauthenticated') {
      // 用户未认证，使用默认设置
      setSettings(defaultSettings);
      setIsLoading(false);
    }
  }, [status, fetchSettings]);

  // 返回所有操作和状态
  return {
    settings,         // 当前用户设置（已合并默认值）
    isLoading,        // 是否正在加载/保存
    error,            // 错误信息
    updateSettings,   // 批量更新设置
    updateSetting,    // 更新单个设置项
    resetSettings,    // 重置为默认值
    isReady: !isLoading && status !== 'loading' // 是否已完成初始化
  };
} 