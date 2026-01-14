import { useState, useCallback } from "react";
import { Question } from "@/types/quiz";
import { parseTextByScript, ScriptTemplate } from "@/utils/scriptParser";
import { getPrompts } from "@/constants/ai";
import { parseQuestions } from "@/utils/questionParser";
import { conversionService } from "@/services/conversionService";
import { useQuizStore } from "@/store/quizStore";
import { useTranslation } from "react-i18next";

interface UseConversionLogicProps {
  onSuccess?: (
    questions: Omit<Question, "id">[],
    bankId: string,
    bankName: string
  ) => void;
}

/**
 * Question Conversion Business Logic Hook
 * Handles core logic for AI and script conversion
 */
export function useConversionLogic({
  onSuccess,
}: UseConversionLogicProps = {}) {
  const { t, i18n } = useTranslation();
  const {
    settings,
    addQuestionBank,
    addQuestionToBank,
    getQuestionBankById,
    setConversionState,
  } = useQuizStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<
    Omit<Question, "id">[]
  >([]);

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

      if (!activeConfig || !activeConfig.apiKey) {
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

        const result = await conversionService.convert(
          {
            baseUrl: activeConfig.baseUrl,
            apiKey: activeConfig.apiKey,
            model: activeConfig.model,
            messages,
          },
          (result) => {
            if (result.success && result.content) {
              const parsed = parseQuestions(result.content);
              setConversionState({
                generatedQuestions: parsed as Question[],
                isConverting: false,
              });
            } else {
              setConversionState({
                isConverting: false,
              });
            }
          }
        );

        if (result.success && result.content) {
          const parsed = parseQuestions(result.content);
          if (parsed.length === 0) {
            setError(t("convert.errors.aiParseFailed"));
          } else {
            setConvertedQuestions(parsed);
          }
        } else {
          setError(result.error || t("convert.errors.aiParseFailed"));
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
    [settings, setConversionState, t]
  );

  /**
   * Script Conversion
   */
  const convertWithScript = useCallback(
    (inputText: string, scriptTemplate: ScriptTemplate) => {
      if (!inputText.trim()) {
        setError(t("convert.errors.noText"));
        return;
      }

      setError(null);
      setConvertedQuestions([]);
      setIsLoadingScript(true);

      try {
        const parsed = parseTextByScript(inputText, scriptTemplate);
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
    [t]
  );

  /**
   * Save to question bank
   */
  const saveToBank = useCallback(
    (config: {
      mode: "new" | "existing";
      bankId?: string;
      newBankName?: string;
      newBankDescription?: string;
    }) => {
      let targetBankId = config.bankId || "";
      let targetBankName = "";

      if (config.mode === "new" && config.newBankName?.trim()) {
        const newBank = addQuestionBank(
          config.newBankName,
          config.newBankDescription || ""
        );
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

      convertedQuestions.forEach((q) => addQuestionToBank(targetBankId, q));

      if (onSuccess) {
        onSuccess(convertedQuestions, targetBankId, targetBankName);
      }

      return { success: true, bankId: targetBankId, bankName: targetBankName };
    },
    [
      convertedQuestions,
      addQuestionBank,
      addQuestionToBank,
      getQuestionBankById,
      onSuccess,
      t,
    ]
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
    setError,
    convertWithAI,
    convertWithScript,
    saveToBank,
    clearResults,
  };
}
