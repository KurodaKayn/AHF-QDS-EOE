/**
 * API Key本地存储服务
 * 使用localStorage存储用户的AI提供商API Key
 * 该模块被以下组件调用：
 * - src/lib/aiHelper.ts: getUserAiConfig函数中通过loadApiKeys获取用户AI配置
 * - src/app/quiz/settings/page.tsx: 通过saveApiKeys和loadApiKeys管理用户API密钥
 */

/**
 * AI提供商API密钥配置接口
 * 定义了存储在localStorage中的API密钥结构
 */
interface ApiKeyConfig {
  deepseekApiKey?: string;      // DeepSeek AI的API密钥
  deepseekBaseUrl?: string;     // DeepSeek AI的自定义基础URL
  alibabaApiKey?: string;       // 阿里巴巴通义千问的API密钥
  provider?: 'deepseek' | 'alibaba';  // 用户选择的AI提供商
}

// 键名前缀，使用用户ID确保每个用户的数据隔离
const API_KEY_PREFIX = 'user_api_key_';

/**
 * 保存用户的API Key配置到localStorage
 * 在用户更新API密钥或切换AI提供商时调用
 * 
 * @param userId 用户ID，用于隔离不同用户的配置
 * @param config API密钥配置对象
 */
export const saveApiKeys = (userId: string, config: ApiKeyConfig): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${API_KEY_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(config));
  } catch (error) {
    console.error('保存API Key失败:', error);
  }
};

/**
 * 从localStorage加载用户的API Key配置
 * 在需要使用AI服务时调用，由aiHelper.ts中的getUserAiConfig函数使用
 * 
 * @param userId 用户ID
 * @returns 用户的API密钥配置对象
 */
export const loadApiKeys = (userId: string): ApiKeyConfig => {
  if (typeof window === 'undefined') return {};
  
  try {
    const key = `${API_KEY_PREFIX}${userId}`;
    const storedData = localStorage.getItem(key);
    
    if (storedData) {
      return JSON.parse(storedData) as ApiKeyConfig;
    }
  } catch (error) {
    console.error('加载API Key失败:', error);
  }
  
  return {};
};

/**
 * 删除用户的API Key配置
 * 在用户注销或重置设置时调用
 * 
 * @param userId 用户ID
 */
export const removeApiKeys = (userId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${API_KEY_PREFIX}${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('删除API Key失败:', error);
  }
}; 