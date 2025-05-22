/**
 * API Key本地存储服务
 * 使用localStorage存储用户的AI提供商API Key
 */

interface ApiKeyConfig {
  deepseekApiKey?: string;
  deepseekBaseUrl?: string;
  alibabaApiKey?: string;
  provider?: 'deepseek' | 'alibaba'; 
}

// 键名前缀，使用用户ID确保每个用户的数据隔离
const API_KEY_PREFIX = 'user_api_key_';

/**
 * 保存用户的API Key配置到localStorage
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