import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AIConfig } from "@/store/quizStore";

const PRESETS = {
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  alibaba: {
    name: "Qwen (Alibaba)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-turbo",
  },
};

interface UseAiConfigFormProps {
  initialConfig?: AIConfig;
  onSave: (config: Omit<AIConfig, "id">) => void;
  onCancel: () => void;
}

export function useAiConfigForm({ initialConfig, onSave, onCancel }: UseAiConfigFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialConfig?.name || "");
  const [type, setType] = useState<"preset" | "custom">(initialConfig?.type || "preset");
  const [provider, setProvider] = useState<"deepseek" | "alibaba" | undefined>(
    initialConfig?.provider,
  );
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || "");
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || "");
  const [model, setModel] = useState(initialConfig?.model || "");

  const handleProviderChange = (newProvider: "deepseek" | "alibaba") => {
    setProvider(newProvider);
    const preset = PRESETS[newProvider];
    setName(preset.name);
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
  };

  const handleSave = () => {
    if (!name || !baseUrl || !apiKey || !model) {
      alert(t("settings.ai.fillAll"));
      return;
    }
    onSave({
      name,
      type,
      provider: type === "preset" ? provider : undefined,
      baseUrl,
      apiKey,
      model,
    });
  };

  return {
    name,
    setName,
    type,
    setType,
    provider,
    baseUrl,
    setBaseUrl,
    apiKey,
    setApiKey,
    model,
    setModel,
    handleProviderChange,
    handleSave,
    onCancel,
  };
}
