"use client";

import { useQuizStore, QuizSettings, AIConfig } from "@/store/quizStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit2,
  Plus,
  Trash2,
  Check,
  Server,
  Globe,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

import { SettingItem } from "@/components/settings/SettingItem";
import { BooleanSettingItem } from "@/components/settings/BooleanSettingItem";
import { AiConfigForm } from "@/components/settings/AiConfigForm";

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
  const { theme, setTheme } = useThemeStore();

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
    | "checkDuplicateQuestion"
  >;

  const handleBooleanSettingToggle = (
    key: BooleanSettingKey,
    value: boolean
  ) => {
    setQuizSetting(key as any, value);
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

      <main className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 md:p-8 pb-20">
        {/* Language Selection */}
        <div className="space-y-4 py-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {t("settings.general")}
          </h2>

          <SettingItem title={t("settings.language")}>
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
          </SettingItem>
        </div>

        {/* Theme Selection */}
        <SettingItem title={t("settings.theme")}>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                theme === "light"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Sun className="w-4 h-4" />
              {t("settings.lightMode")}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                theme === "dark"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Moon className="w-4 h-4" />
              {t("settings.darkMode")}
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                theme === "system"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Monitor className="w-4 h-4" />
              {t("settings.systemMode")}
            </button>
          </div>
        </SettingItem>

        {/* Practice/Review Settings */}
        <div className="space-y-4 py-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            {t("nav.practice")} / {t("nav.review")}
          </h2>
          <BooleanSettingItem
            title={t("settings.practice.shuffleOptions")}
            description={t("settings.practice.shuffleOptionsDesc")}
            value={settings.shufflePracticeOptions}
            onChange={(val) =>
              handleBooleanSettingToggle("shufflePracticeOptions", val)
            }
          />
          <BooleanSettingItem
            title={t("settings.review.shuffleOptions")}
            description={t("settings.review.shuffleOptionsDesc")}
            value={settings.shuffleReviewOptions}
            onChange={(val) =>
              handleBooleanSettingToggle("shuffleReviewOptions", val)
            }
          />
          <BooleanSettingItem
            title={t("settings.practice.shuffleQuestions")}
            description={t("settings.practice.shuffleQuestionsDesc")}
            value={settings.shufflePracticeQuestionOrder}
            onChange={(val) =>
              handleBooleanSettingToggle("shufflePracticeQuestionOrder", val)
            }
          />
          <BooleanSettingItem
            title={t("settings.review.shuffleQuestions")}
            description={t("settings.review.shuffleQuestionsDesc")}
            value={settings.shuffleReviewQuestionOrder}
            onChange={(val) =>
              handleBooleanSettingToggle("shuffleReviewQuestionOrder", val)
            }
          />
          <BooleanSettingItem
            title={t("settings.review.autoRemove")}
            description={t("settings.review.autoRemoveDesc")}
            value={settings.markMistakeAsCorrectedOnReviewSuccess}
            onChange={(val) =>
              handleBooleanSettingToggle(
                "markMistakeAsCorrectedOnReviewSuccess",
                val
              )
            }
          />
          <BooleanSettingItem
            title={t("settings.import.checkDuplicate")}
            description={t("settings.import.checkDuplicateDesc")}
            value={settings.checkDuplicateQuestion}
            onChange={(val) =>
              handleBooleanSettingToggle("checkDuplicateQuestion", val)
            }
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
