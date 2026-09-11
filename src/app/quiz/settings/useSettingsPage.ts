import { useState } from "react";
import type { QuizSettings, AIConfig } from "@/store/quizStore";
import { useQuizStore } from "@/store/quizStore";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/store/themeStore";

type BooleanSettingKey = Extract<
  keyof QuizSettings,
  | "shufflePracticeOptions"
  | "shuffleReviewOptions"
  | "shufflePracticeQuestionOrder"
  | "shuffleReviewQuestionOrder"
  | "markMistakeAsCorrectedOnReviewSuccess"
  | "checkDuplicateQuestion"
>;

export function useSettingsPage() {
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
  const { t, i18n } = useTranslation();

  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isAddingMode, setIsAddingMode] = useState(false);

  const handleBooleanSettingToggle = (key: BooleanSettingKey, value: boolean) => {
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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return {
    t,
    i18n,
    settings,
    theme,
    setTheme,
    editingConfigId,
    setEditingConfigId,
    isAddingMode,
    setIsAddingMode,
    deleteAiConfig,
    setActiveAiConfig,
    resetQuizSettings,
    handleBooleanSettingToggle,
    handleCreateConfig,
    handleUpdateConfig,
    handleLanguageChange,
  };
}
