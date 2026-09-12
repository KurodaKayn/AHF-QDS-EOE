import { useState, useCallback } from "react";
import { getPrompts } from "@/constants/ai";
import { callAI } from "@/model/ai";
import {
  parseQuestions,
  parseTextByScript,
  useQuizStore,
  type Question,
  type ScriptTemplate,
} from "@/model/quiz";
import { useTranslation } from "react-i18next";

interface UseConversionLogicProps {
  onSuccess?: (questions: Question[], bankId: string, bankName: string) => void;
}

/**
 * Question Conversion Business Logic Hook.
 * Co-located with ConvertPage.
 */
export function useConversionLogic({ onSuccess }: UseConversionLogicProps = {}) {
  const { t, i18n } = useTranslation();
  const { settings, addQuestionBank, addQuestionsToBank, getQuestionBankById } = useQuizStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<Question[]>(() => {
    return (useQuizStore.getState().conversionState.generatedQuestions as Question[]) || [];
  });

  /**
   * AI Conversion
   */
  const convertWithAI = useCallback(
    async (inputText: string) => {
      if (!inputText.trim()) {
        setError(t("convert.errors.noText"));
        return;
      }

      setError(null);
      setConvertedQuestions([]);
      setIsLoading(true);
      const { aiConfigs, activeAiConfigId } = settings;
      const activeConfig = aiConfigs.find((c) => c.id === activeAiConfigId);

      if (!activeConfig) {
        setError(t("convert.errors.noAIConfig"));
        setIsLoading(false);
        return;
      }

      try {
        const prompts = getPrompts(i18n.language);
        const messages = [
          { role: "system" as const, content: prompts.convert },
          { role: "user" as const, content: inputText },
        ];

        const content = await callAI(activeConfig, messages);
        const parsed = await parseQuestions(content);
        if (parsed.length === 0) {
          setError(t("convert.errors.aiParseFailed"));
        } else {
          setConvertedQuestions(parsed);
        }
      } catch (e: any) {
        if (e.message && e.message.includes("message channel closed")) {
          // Silently ignore interrupted requests
        } else {
          setError(e.message || t("convert.errors.noText"));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [settings, t, i18n.language],
  );

  /**
   * Script Conversion
   */
  const convertWithScript = useCallback(
    async (inputText: string, scriptTemplate: ScriptTemplate) => {
      if (!inputText.trim()) {
        setError(t("convert.errors.noText"));
        return;
      }

      setError(null);
      setConvertedQuestions([]);
      setIsLoadingScript(true);

      try {
        const parsed = await parseTextByScript(inputText, scriptTemplate);
        if (parsed.length === 0 && inputText.trim().length > 0) {
          setError(t("convert.errors.scriptFailed"));
        }
        setConvertedQuestions(parsed);
      } catch (e: any) {
        setError(t("convert.errors.scriptError", { error: e.message }));
      } finally {
        setIsLoadingScript(false);
      }
    },
    [t],
  );

  /**
   * Save to question bank
   */
  const saveToBank = useCallback(
    async (config: {
      mode: "new" | "existing";
      bankId?: string;
      newBankName?: string;
      newBankDescription?: string;
    }) => {
      let targetBankId = config.bankId || "";
      let targetBankName = "";

      if (config.mode === "new" && config.newBankName?.trim()) {
        const newBank = await addQuestionBank(config.newBankName, config.newBankDescription || "");
        targetBankId = newBank.id;
        targetBankName = newBank.name;
      } else if (config.mode === "existing" && config.bankId) {
        const bank = getQuestionBankById(config.bankId);
        targetBankName = bank?.name || "";
      }

      if (!targetBankId) {
        setError(t("convert.errors.noTargetBank"));
        return { success: false };
      }

      const questionsData = convertedQuestions.map((q) => {
        const { id: _id, ...questionData } = q;
        return questionData;
      });

      await addQuestionsToBank(targetBankId, questionsData);

      if (onSuccess) {
        onSuccess(convertedQuestions, targetBankId, targetBankName);
      }

      return { success: true, bankId: targetBankId, bankName: targetBankName };
    },
    [convertedQuestions, addQuestionBank, addQuestionsToBank, getQuestionBankById, onSuccess, t],
  );

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setConvertedQuestions([]);
    setError(null);
  }, []);

  return {
    isLoading,
    isLoadingScript,
    error,
    convertedQuestions,
    setConvertedQuestions,
    setError,
    convertWithAI,
    convertWithScript,
    saveToBank,
    clearResults,
  };
}
