import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { EXAMPLE_QUESTION_TEXT } from "@/constants/quiz";
import { ScriptTemplate } from "@/model/quiz";
import { useTranslation } from "react-i18next";
import { useConversionLogic } from "./useConversionLogic";
import { toast } from "sonner";

/**
 * Hook encapsulating all state, effects, and handlers for ConvertPage.
 * Co-located with ConvertPage.
 */
export function useConvertPage() {
  const router = useRouter();
  const { settings, questionBanks, conversionState, setConversionState } = useQuizStore();
  const { t, i18n } = useTranslation();

  // Local UI state
  const [inputText, setInputText] = useState("");
  const [conversionMode, setConversionMode] = useState<"ai" | "script">("ai");
  const [scriptTemplate, setScriptTemplate] = useState<ScriptTemplate>(ScriptTemplate.ChaoXing);
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedBankId, setSavedBankId] = useState("");
  const [savedBankName, setSavedBankName] = useState("");

  const isUpdatingFromStore = useRef(false);

  // Conversion business logic
  const {
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
  } = useConversionLogic({
    onSuccess: (questions, bankId, bankName) => {
      setSavedBankId(bankId);
      setSavedBankName(bankName);
      setIsSuccess(true);
      setInputText("");
      clearResults();
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  // Load state from store on mount
  useEffect(() => {
    if (conversionState) {
      isUpdatingFromStore.current = true;
      setInputText(conversionState.inputText || "");
      setConversionMode(conversionState.mode || "ai");
      setScriptTemplate(
        (conversionState.scriptTemplate as ScriptTemplate) || ScriptTemplate.ChaoXing,
      );
      if (conversionState.generatedQuestions && conversionState.generatedQuestions.length > 0) {
        setConvertedQuestions(conversionState.generatedQuestions);
      }
      setTimeout(() => {
        isUpdatingFromStore.current = false;
      }, 0);
    }
  }, [conversionState, setConvertedQuestions]);

  // Sync local state to store when changed
  useEffect(() => {
    if (isUpdatingFromStore.current) return;

    setConversionState({
      inputText,
      mode: conversionMode,
      scriptTemplate,
      generatedQuestions: convertedQuestions as any[],
      isConverting: isLoading || isLoadingScript,
    });
  }, [
    inputText,
    conversionMode,
    scriptTemplate,
    convertedQuestions,
    isLoading,
    isLoadingScript,
    setConversionState,
  ]);

  const handleConvert = () => {
    if (conversionMode === "script") {
      convertWithScript(inputText, scriptTemplate);
    } else {
      convertWithAI(inputText);
    }
  };

  const handleSave = async (config: {
    mode: "new" | "existing";
    bankId?: string;
    newBankName?: string;
    newBankDescription?: string;
  }) => {
    const result = await saveToBank(config);
    if (!result.success) {
      toast.error(error || t("convert.saveFailed"));
    }
  };

  const handleContinue = () => {
    setIsSuccess(false);
    clearResults();
    setInputText("");
    setSavedBankId("");
    setSavedBankName("");
  };

  const activeConfig = settings.aiConfigs.find((c) => c.id === settings.activeAiConfigId);
  const isConverting =
    (isLoading && conversionMode === "ai") || (isLoadingScript && conversionMode === "script");
  const isConvertDisabled = isLoading || isLoadingScript || !inputText.trim();

  return {
    t,
    i18nLanguage: i18n.language,
    router,
    questionBanks,
    inputText,
    setInputText,
    conversionMode,
    setConversionMode,
    scriptTemplate,
    setScriptTemplate,
    isExampleModalOpen,
    setIsExampleModalOpen,
    isSuccess,
    savedBankId,
    savedBankName,
    isLoading,
    isLoadingScript,
    error,
    setError,
    convertedQuestions,
    activeConfig,
    isConverting,
    isConvertDisabled,
    handleConvert,
    handleSave,
    handleContinue,
    exampleQuestionText: EXAMPLE_QUESTION_TEXT,
  };
}
