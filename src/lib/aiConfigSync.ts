import { invoke } from "@tauri-apps/api/core";

export interface AiProviderConfigPayload {
  id: string;
  name: string;
  type: "preset" | "custom";
  provider?: "deepseek" | "alibaba";
  baseUrl: string;
  apiKey: string;
  model: string;
}

const isTauriRuntime =
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export async function saveAiConfigOnBackend(config: AiProviderConfigPayload): Promise<void> {
  if (!isTauriRuntime) return;
  await invoke("save_ai_config", { config });
}

export async function deleteAiConfigOnBackend(id: string): Promise<void> {
  if (!isTauriRuntime) return;
  await invoke("delete_ai_config", { id });
}

export async function getAiConfigFromBackend(id: string): Promise<AiProviderConfigPayload | null> {
  if (!isTauriRuntime) return null;
  return invoke<AiProviderConfigPayload | null>("get_ai_config", { id });
}

export async function listAiConfigsFromBackend(): Promise<AiProviderConfigPayload[]> {
  if (!isTauriRuntime) return [];
  return invoke<AiProviderConfigPayload[]>("list_ai_configs");
}
