export interface AiMessage {
  role: string;
  content: string;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  type: "preset" | "custom";
  provider?: "deepseek" | "alibaba";
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type AIConfig = AiProviderConfig;

export interface AiProviderConfigPayload {
  id: string;
  name: string;
  type: "preset" | "custom";
  provider?: "deepseek" | "alibaba";
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AiCompleteRequest {
  providerConfigId: string;
  messages: AiMessage[];
  stream?: boolean;
  requestId?: string;
  temperature?: number;
}

export interface AiCompleteResponse {
  content: string;
}
