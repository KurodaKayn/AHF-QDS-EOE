import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

/**
 * 获取 AI 提供商实例
 */
export const getAIProvider = (
  provider: 'deepseek' | 'alibaba',
  apiKey: string,
  baseUrl?: string
) => {
  if (provider === 'deepseek') {
    return createOpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.deepseek.com/v1',
    });
  } else {
    return createOpenAI({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  }
};

/**
 * 获取模型名称
 */
const getModelName = (provider: 'deepseek' | 'alibaba') => {
  return provider === 'deepseek' ? 'deepseek-chat' : 'qwen-turbo';
};

/**
 * 调用 AI 生成文本（非流式）
 */
export const callAI = async (
  provider: 'deepseek' | 'alibaba',
  messages: { role: string; content: string }[],
  apiKey: string,
  baseUrl?: string
): Promise<string> => {
  try {
    const ai = getAIProvider(provider, apiKey, baseUrl);
    const modelName = getModelName(provider);

    const { text } = await generateText({
      model: ai(modelName),
      messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    });

    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '调用 AI 服务失败';
    console.error('AI API 调用错误:', error);
    throw new Error(errorMessage);
  }
};

/**
 * 调用 AI 生成文本（流式）
 */
export const callAIStream = async (
  provider: 'deepseek' | 'alibaba',
  messages: { role: string; content: string }[],
  apiKey: string,
  onChunk: (chunk: string) => void,
  baseUrl?: string
): Promise<string> => {
  try {
    const ai = getAIProvider(provider, apiKey, baseUrl);
    const modelName = getModelName(provider);

    const { textStream } = streamText({
      model: ai(modelName),
      messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    });

    let fullText = '';
    for await (const chunk of textStream) {
      fullText += chunk;
      onChunk(chunk);
    }

    return fullText;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '调用 AI 服务失败';
    console.error('AI 流式调用错误:', error);
    throw new Error(errorMessage);
  }
};
