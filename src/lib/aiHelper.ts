import { loadApiKeys } from './apiKeyStorage';
import { callAI } from '@/constants/ai';

/**
 * 获取当前用户的AI提供商配置
 * 该函数从apiKeyStorage中加载用户的API密钥配置
 * 被callAiWithUserConfig函数调用
 * 
 * @param userId 用户ID
 * @returns AI提供商配置对象，包含provider、apiKey和baseUrl
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
 * 这是项目中推荐使用的AI调用方法，会自动处理用户配置
 * 该函数在需要调用AI时使用，会从用户配置中获取AI提供商和密钥信息
 * 内部调用src/constants/ai.ts中的callAI函数
 * 
 * @param userId 用户ID
 * @param messages 消息数组，包含role和content
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