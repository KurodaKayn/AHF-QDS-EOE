"use client";

import { useQuizStore, QuizSettings, AIConfig } from "@/store/quizStore";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2,
  Plus,
  Trash2,
  Check,
  X,
  Server,
  Key,
  Box,
  Globe,
} from "lucide-react";

// Helper component for individual boolean settings
interface SettingRowProps {
  label: string;
  description?: string;
  settingKey: keyof Pick<
    QuizSettings,
    | "shufflePracticeOptions"
    | "shuffleReviewOptions"
    | "shufflePracticeQuestionOrder"
    | "shuffleReviewQuestionOrder"
    | "markMistakeAsCorrectedOnReviewSuccess"
  >;
  currentValue: boolean;
  onToggle: (key: SettingRowProps["settingKey"], value: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  settingKey,
  currentValue,
  onToggle,
}) => {
  const { t } = useTranslation();
  return (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {label}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onToggle(settingKey, !currentValue)}
        className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors w-24 text-center
          ${
            currentValue
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200"
          }
        `}
      >
        {currentValue ? t("settings.ai.enabled") : t("settings.ai.disabled")}
      </button>
    </div>
  );
};

// AI Config Form Component
interface AiConfigFormProps {
  initialConfig?: AIConfig;
  onSave: (config: Omit<AIConfig, "id">) => void;
  onCancel: () => void;
}

const AiConfigForm: React.FC<AiConfigFormProps> = ({
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

export default function SettingsPage() {
  const {
    settings,
    setQuizSetting,
    resetQuizSettings,
    addAiConfig,
    updateAiConfig,
    deleteAiConfig,
    setActiveAiConfig,
  } = useQuizStore();

  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Explicitly type the key for boolean settings
  type BooleanSettingKey = Extract<
    keyof QuizSettings,
    | "shufflePracticeOptions"
    | "shuffleReviewOptions"
    | "shufflePracticeQuestionOrder"
    | "shuffleReviewQuestionOrder"
    | "markMistakeAsCorrectedOnReviewSuccess"
  >;

  const handleBooleanSettingToggle = (
    key: BooleanSettingKey,
    value: boolean
  ) => {
    setQuizSetting(key, value);
  };

  const handleCreateConfig = (config: Omit<AIConfig, "id">) => {
    addAiConfig(config);
    setIsAddingMode(false);
  };

  const handleUpdateConfig = (config: Omit<AIConfig, "id">) => {
    if (editingConfigId) {
      updateAiConfig(editingConfigId, config);
      setEditingConfigId(null);
    }
  };

  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <header className="mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {t("settings.title")}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 divide-y divide-gray-200 dark:divide-gray-700 pb-20">
        {/* Language Selection */}
        <div className="space-y-4 py-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {t("settings.general")}
          </h2>

          <div className="py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {t("settings.language")}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange("zh")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  i18n.language === "zh"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                中文
              </button>
              <button
                onClick={() => handleLanguageChange("en")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  i18n.language === "en"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Practice/Review Settings */}
        <div className="space-y-4 py-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {t("nav.practice")} / {t("nav.review")}
          </h2>
          <SettingRow
            label={t("settings.practice.shuffleOptions")}
            description={t("settings.practice.shuffleOptionsDesc")}
            settingKey="shufflePracticeOptions"
            currentValue={settings.shufflePracticeOptions}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label={t("settings.review.shuffleOptions")}
            description={t("settings.review.shuffleOptionsDesc")}
            settingKey="shuffleReviewOptions"
            currentValue={settings.shuffleReviewOptions}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label={t("settings.practice.shuffleQuestions")}
            description={t("settings.practice.shuffleQuestionsDesc")}
            settingKey="shufflePracticeQuestionOrder"
            currentValue={settings.shufflePracticeQuestionOrder}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label={t("settings.review.shuffleQuestions")}
            description={t("settings.review.shuffleQuestionsDesc")}
            settingKey="shuffleReviewQuestionOrder"
            currentValue={settings.shuffleReviewQuestionOrder}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label={t("settings.review.autoRemove")}
            description={t("settings.review.autoRemoveDesc")}
            settingKey="markMistakeAsCorrectedOnReviewSuccess"
            currentValue={settings.markMistakeAsCorrectedOnReviewSuccess}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label={t("settings.import.checkDuplicate")}
            description={t("settings.import.checkDuplicateDesc")}
            settingKey={"checkDuplicateQuestion" as any}
            currentValue={settings.checkDuplicateQuestion}
            onToggle={handleBooleanSettingToggle as any}
          />
        </div>

        {/* AI Provider Settings */}
        <div className="py-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              {t("settings.ai.title")}
            </h2>
            {!isAddingMode && !editingConfigId && (
              <button
                onClick={() => setIsAddingMode(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> {t("settings.ai.addModel")}
              </button>
            )}
          </div>

          {/* Add Form */}
          {isAddingMode && (
            <AiConfigForm
              onSave={handleCreateConfig}
              onCancel={() => setIsAddingMode(false)}
            />
          )}

          {/* Config List */}
          <div className="space-y-3">
            {settings.aiConfigs.map((config) => {
              const isActive = settings.activeAiConfigId === config.id;
              const isEditing = editingConfigId === config.id;

              if (isEditing) {
                return (
                  <AiConfigForm
                    key={config.id}
                    initialConfig={config}
                    onSave={handleUpdateConfig}
                    onCancel={() => setEditingConfigId(null)}
                  />
                );
              }

              return (
                <div
                  key={config.id}
                  onClick={() => setActiveAiConfig(config.id)}
                  className={`
                      relative p-4 rounded-lg border cursor-pointer transition-all duration-200
                      flex items-center justify-between
                      ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-700 ring-1 ring-blue-500"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                      }
                    `}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                         w-5 h-5 rounded-full border flex items-center justify-center
                         ${
                           isActive
                             ? "border-blue-600 bg-blue-600"
                             : "border-gray-400"
                         }
                       `}
                    >
                      {isActive && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        {config.name}
                        {config.type === "preset" && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full font-normal">
                            {t("settings.ai.preset")}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3" /> {config.model}
                        </span>
                        <span className="truncate max-w-[200px] flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {config.baseUrl}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setEditingConfigId(config.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title={t("common.edit")}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t("settings.ai.deleteConfirm"))) {
                          deleteAiConfig(config.id);
                        }
                      }}
                      disabled={settings.aiConfigs.length <= 1}
                      className={`p-2 rounded-md transition-colors ${
                        settings.aiConfigs.length <= 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
                      }`}
                      title={t("common.delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Settings Button */}
        <div className="mt-8 pt-6 flex justify-end">
          <button
            onClick={() => {
              if (confirm(t("settings.reset.confirm"))) {
                resetQuizSettings();
              }
            }}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            {t("settings.reset.button")}
          </button>
        </div>
      </main>
    </>
  );
}
