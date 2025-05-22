import { loadApiKeys } from './apiKeyStorage';
import { callAI } from '@/constants/ai';

/**
 * 获取当前用户的AI提供商配置
 * @param userId 用户ID
 * @returns AI提供商配置对象
 */
export function getUserAiConfig(userId: string) {
  const apiConfig = loadApiKeys(userId);
  return {
    provider: apiConfig.provider || 'deepseek',
    apiKey: apiConfig.provider === 'deepseek' ? apiConfig.deepseekApiKey : apiConfig.alibabaApiKey,
    baseUrl: apiConfig.provider === 'deepseek' ? apiConfig.deepseekBaseUrl : undefined
  };
}

/**
 * 使用当前用户配置的AI服务发送请求
 * @param userId 用户ID
 * @param messages 消息数组
 * @param useStream 是否使用流式响应
 * @param onChunk 流式响应的回调函数
 * @returns AI响应
 */
export async function callAiWithUserConfig(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  useStream: boolean = false,
  onChunk?: (chunk: string) => void
) {
  const { provider, apiKey, baseUrl } = getUserAiConfig(userId);
  
  if (!apiKey) {
    throw new Error('未设置API密钥，请在设置页面配置您的AI服务提供商API密钥');
  }
  
  return callAI(provider, messages, apiKey, baseUrl, useStream, onChunk);
} 