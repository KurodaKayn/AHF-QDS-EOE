import i18n from "@/i18n/config";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { nanoid } from "nanoid";

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

interface AiStreamChunkEvent {
  requestId: string;
  content: string;
}

interface AiStreamDoneEvent {
  requestId: string;
  content: string;
}

const isTauriRuntime =
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

async function resolveProviderConfig(providerConfigId: string): Promise<AiProviderConfig> {
  if (isTauriRuntime) {
    const config = await invoke<AiProviderConfig | null>("get_ai_config", {
      id: providerConfigId,
    });
    if (!config) {
      throw new Error(
        i18n.t("common.aiCallFailed", {
          defaultValue: "AI configuration not found",
        }),
      );
    }
    return config;
  }

  const { useQuizStore } = await import("@/store/quizStore");
  const config = useQuizStore
    .getState()
    .settings.aiConfigs.find((item) => item.id === providerConfigId);
  if (!config) {
    throw new Error(
      i18n.t("common.aiCallFailed", {
        defaultValue: "AI configuration not found",
      }),
    );
  }
  return config;
}

function buildChatCompletionsUrl(baseUrl: string): string {
  if (baseUrl.endsWith("/chat/completions")) {
    return baseUrl;
  }

  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

async function callDirectAI(
  config: AiProviderConfig,
  request: AiCompleteRequest,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const apiURL = buildChatCompletionsUrl(config.baseUrl);
  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: request.messages,
      stream: request.stream ?? false,
      temperature: request.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        i18n.t("common.apiFailed", {
          status: response.status,
          defaultValue: `API request failed: ${response.status}`,
        }),
    );
  }

  if (!request.stream) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error(
      i18n.t("common.streamReadFailed", {
        defaultValue: "Unable to read response stream",
      }),
    );
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const lineBreak = buffer.indexOf("\n");
      if (lineBreak === -1) break;

      const line = buffer.slice(0, lineBreak).trim();
      buffer = buffer.slice(lineBreak + 1);

      if (!line.startsWith("data:")) continue;

      const data = line.replace(/^data:\s*/, "");
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || "";
        if (content) {
          fullText += content;
          onChunk?.(content);
        }
      } catch {
        // Ignore malformed partial chunks.
      }
    }
  }

  return fullText;
}

export async function callAI(providerConfigId: string, messages: AiMessage[]): Promise<string> {
  const request: AiCompleteRequest = {
    providerConfigId,
    messages,
    stream: false,
  };

  if (isTauriRuntime) {
    const response = await invoke<AiCompleteResponse>("ai_complete", {
      request,
    });
    return response.content;
  }

  const config = await resolveProviderConfig(providerConfigId);
  return callDirectAI(config, request);
}

export async function callAIStream(
  providerConfigId: string,
  messages: AiMessage[],
  onChunk: (chunk: string) => void,
): Promise<string> {
  const requestId = nanoid();
  const request: AiCompleteRequest = {
    providerConfigId,
    messages,
    stream: true,
    requestId,
  };

  if (isTauriRuntime) {
    let fullText = "";

    const unlistenChunk = await listen<AiStreamChunkEvent>("ai-stream:chunk", (event) => {
      if (event.payload.requestId !== requestId) return;
      fullText += event.payload.content;
      onChunk(event.payload.content);
    });

    const unlistenDone = await listen<AiStreamDoneEvent>("ai-stream:done", (event) => {
      if (event.payload.requestId !== requestId) return;
      fullText = event.payload.content;
    });

    try {
      const response = await invoke<AiCompleteResponse>("ai_complete", {
        request,
      });
      return response.content || fullText;
    } finally {
      unlistenChunk();
      unlistenDone();
    }
  }

  const config = await resolveProviderConfig(providerConfigId);
  return callDirectAI(config, request, onChunk);
}
