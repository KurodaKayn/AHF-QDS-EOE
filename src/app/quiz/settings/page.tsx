"use client";

import { useQuizStore, QuizSettings, AIConfig } from "@/store/quizStore";
import { useState, useEffect } from "react";
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
        {currentValue ? "已启用" : "已禁用"}
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
    // Auto-fill if empty or switching presets (optional: force override?)
    // Let's force override for better UX when selecting a preset, but allow user to edit after?
    // Usually presets imply fixed settings except API Key.
    // user requirement: "select preset provider"
    setName(preset.name);
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
  };

  const handleSave = () => {
    if (!name || !baseUrl || !apiKey || !model) {
      alert("请填写所有必填项");
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
        {initialConfig ? "编辑模型配置" : "添加新模型"}
      </h3>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          配置类型
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
            预设服务商
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
            自定义服务
          </button>
        </div>
      </div>

      {type === "preset" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            选择服务商
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
          配置名称
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
            placeholder="例如: My DeepSeek"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key
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
          Base URL{" "}
          {type === "preset" && (
            <span className="text-xs text-gray-500">(通常无需修改)</span>
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
          兼容 OpenAI 格式的 API 地址
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          模型名称 (Model){" "}
          {type === "preset" && (
            <span className="text-xs text-gray-500">(通常无需修改)</span>
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
            placeholder="例如: gpt-4, deepseek-chat"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          保存配置
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

  return (
    <>
      <header className="mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            应用设置
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 divide-y divide-gray-200 dark:divide-gray-700 pb-20">
        {/* General Practice/Review Settings */}
        <div className="space-y-4 py-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            练习与复习设置
          </h2>
          <SettingRow
            label="练习模式：打乱选项顺序"
            description="单选题和多选题的选项将随机排列。"
            settingKey="shufflePracticeOptions"
            currentValue={settings.shufflePracticeOptions}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label="错题回顾：打乱选项顺序"
            description="错题练习中，单选题和多选题的选项将随机排列。"
            settingKey="shuffleReviewOptions"
            currentValue={settings.shuffleReviewOptions}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label="练习模式：打乱题目顺序"
            description="进入练习时，题库中的题目将以随机顺序出现。"
            settingKey="shufflePracticeQuestionOrder"
            currentValue={settings.shufflePracticeQuestionOrder}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label="错题回顾：打乱题目顺序"
            description="进行错题回顾时，错题将以随机顺序出现。"
            settingKey="shuffleReviewQuestionOrder"
            currentValue={settings.shuffleReviewQuestionOrder}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label="错题订正后从错题本移除"
            description="在错题回顾中答对题目后，是否将其视为已订正。"
            settingKey="markMistakeAsCorrectedOnReviewSuccess"
            currentValue={settings.markMistakeAsCorrectedOnReviewSuccess}
            onToggle={handleBooleanSettingToggle}
          />
          <SettingRow
            label="导入题目时查重"
            description="开启后，导入题库时会自动跳过重复题目（题干完全一致视为重复）"
            settingKey={"checkDuplicateQuestion" as any}
            currentValue={settings.checkDuplicateQuestion}
            onToggle={handleBooleanSettingToggle as any}
          />
        </div>

        {/* AI Provider Settings */}
        <div className="py-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              题目转换 AI 模型
            </h2>
            {!isAddingMode && !editingConfigId && (
              <button
                onClick={() => setIsAddingMode(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> 添加模型
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
                            预设
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
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("确定要删除这个配置吗？")) {
                          deleteAiConfig(config.id);
                        }
                      }}
                      disabled={settings.aiConfigs.length <= 1}
                      className={`p-2 rounded-md transition-colors ${
                        settings.aiConfigs.length <= 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
                      }`}
                      title="删除"
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
              if (
                confirm(
                  "确定要恢复所有设置到默认状态吗？这将清除所有自定义 AI 配置。"
                )
              ) {
                resetQuizSettings();
              }
            }}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            恢复默认设置
          </button>
        </div>
      </main>
    </>
  );
}
