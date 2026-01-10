"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AIConfig } from "@/store/quizStore";
import { Box, Key, Globe, Server } from "lucide-react";

interface AiConfigFormProps {
  initialConfig?: AIConfig;
  onSave: (config: Omit<AIConfig, "id">) => void;
  onCancel: () => void;
}

export const AiConfigForm: React.FC<AiConfigFormProps> = ({
  initialConfig,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialConfig?.name || "");
  const [type, setType] = useState<"preset" | "custom">(
    initialConfig?.type || "preset"
  );
  const [provider, setProvider] = useState<"deepseek" | "alibaba" | undefined>(
    initialConfig?.provider
  );
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || "");
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || "");
  const [model, setModel] = useState(initialConfig?.model || "");

  // Presets definition
  const presets = {
    deepseek: {
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
    },
    alibaba: {
      name: "通义千问",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "qwen-turbo",
    },
  };

  // Handle Preset Change
  const handleProviderChange = (newProvider: "deepseek" | "alibaba") => {
    setProvider(newProvider);
    const preset = presets[newProvider];
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

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {initialConfig ? t("settings.ai.editModel") : t("settings.ai.newModel")}
      </h3>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("settings.ai.type")}
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setType("preset");
              if (!provider) handleProviderChange("deepseek");
            }}
            className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors
              ${
                type === "preset"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
          >
            {t("settings.ai.preset")}
          </button>
          <button
            onClick={() => setType("custom")}
            className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors
              ${
                type === "custom"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
          >
            {t("settings.ai.custom")}
          </button>
        </div>
      </div>

      {type === "preset" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("settings.ai.selectProvider")}
          </label>
          <select
            value={provider}
            onChange={(e) =>
              handleProviderChange(e.target.value as "deepseek" | "alibaba")
            }
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="deepseek">DeepSeek</option>
            <option value="alibaba">通义千问 (Alibaba)</option>
          </select>
        </div>
      )}

      {/* Common Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("settings.ai.name")}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Box className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("settings.ai.namePlaceholder")}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("settings.ai.apiKey")}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="sk-..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("settings.ai.baseUrl")}{" "}
          {type === "preset" && (
            <span className="text-xs text-gray-500">
              {t("settings.ai.baseUrlDesc")}
            </span>
          )}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.example.com/v1"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t("settings.ai.baseUrlHint")}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t("settings.ai.model")}{" "}
          {type === "preset" && (
            <span className="text-xs text-gray-500">
              {t("settings.ai.baseUrlDesc")}
            </span>
          )}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Server className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("settings.ai.modelPlaceholder")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          {t("settings.ai.cancel")}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {t("settings.ai.save")}
        </button>
      </div>
    </div>
  );
};
