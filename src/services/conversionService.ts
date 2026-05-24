import { callAI } from "@/lib/ai";

export interface ConversionRequest {
  providerConfigId: string;
  messages: Array<{ role: string; content: string }>;
}

export interface ConversionResult {
  success: boolean;
  content?: string;
  error?: string;
}

type ResultCallback = (result: ConversionResult) => void;

class ConversionService {
  async convert(request: ConversionRequest, callback?: ResultCallback): Promise<ConversionResult> {
    try {
      const content = await callAI(request.providerConfigId, request.messages);
      const result: ConversionResult = {
        success: true,
        content,
      };
      callback?.(result);
      return result;
    } catch (error) {
      const result: ConversionResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      callback?.(result);
      return result;
    }
  }
}

export const conversionService = new ConversionService();
