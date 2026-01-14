"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaMagic, FaSpinner } from "react-icons/fa";
import { MdCode } from "react-icons/md";
import { FiXCircle } from "react-icons/fi";
import { useQuizStore } from "@/store/quizStore";
import { EXAMPLE_QUESTION_TEXT } from "@/constants/quiz";
import { ScriptTemplate } from "@/utils/scriptParser";
import {
  getScriptExampleContent,
  getScriptExampleTitle,
} from "@/constants/scriptExamples";
import { ConversionModeSelector } from "@/components/quiz/ConversionModeSelector";
import { AIProviderInfo } from "@/components/quiz/AIProviderInfo";
import { TextInputArea } from "@/components/quiz/TextInputArea";
import { QuestionList } from "@/components/quiz/QuestionList";
import { SaveToBankForm } from "@/components/quiz/SaveToBankForm";
import { ConversionSuccess } from "@/components/quiz/ConversionSuccess";
import { ExampleModal } from "@/components/quiz/ExampleModal";
import { useTranslation } from "react-i18next";
import { useConversionLogic } from "@/hooks/useConversionLogic";
import { toast } from "sonner";

/**
 * Question Conversion Page
 * Refactored version with separated UI and business logic
 */
export default function ConvertPage() {
  const router = useRouter();
  const { settings, questionBanks, conversionState, setConversionState } =
    useQuizStore();
  const { t, i18n } = useTranslation();

  // Local UI state
  const [inputText, setInputText] = useState("");
  const [conversionMode, setConversionMode] = useState<"ai" | "script">("ai");
  const [scriptTemplate, setScriptTemplate] = useState<ScriptTemplate>(
    ScriptTemplate.ChaoXing
  );
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedBankId, setSavedBankId] = useState("");
  const [savedBankName, setSavedBankName] = useState("");

  // Ref to prevent circular updates
  const isUpdatingFromStore = useRef(false);

  // Conversion business logic
  const {
    isLoading,
    isLoadingScript,
    error,
    convertedQuestions,
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
        (conversionState.scriptTemplate as ScriptTemplate) ||
          ScriptTemplate.ChaoXing
      );
      setTimeout(() => {
        isUpdatingFromStore.current = false;
      }, 0);
    }
  }, []);

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

  /**
   * Handle conversion
   */
  const handleConvert = () => {
    if (conversionMode === "script") {
      convertWithScript(inputText, scriptTemplate);
    } else {
      convertWithAI(inputText);
    }
  };

  /**
   * Handle save to bank
   */
  const handleSave = (config: {
    mode: "new" | "existing";
    bankId?: string;
    newBankName?: string;
    newBankDescription?: string;
  }) => {
    const result = saveToBank(config);
    if (!result.success) {
      toast.error(error || t("convert.saveFailed"));
    }
  };

  /**
   * Continue conversion
   */
  const handleContinue = () => {
    setIsSuccess(false);
    clearResults();
    setInputText("");
    setSavedBankId("");
    setSavedBankName("");
  };

  const activeConfig = settings.aiConfigs.find(
    (c) => c.id === settings.activeAiConfigId
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          {t("convert.pageTitle")}
        </h1>

        <ConversionModeSelector
          mode={conversionMode}
          onModeChange={setConversionMode}
          scriptTemplate={scriptTemplate}
          onScriptTemplateChange={setScriptTemplate}
          onShowExample={() => setIsExampleModalOpen(true)}
        />

        <TextInputArea
          value={inputText}
          onChange={setInputText}
          onLoadExample={() => setInputText(EXAMPLE_QUESTION_TEXT)}
          onOCRError={(err) =>
            setError(t("convert.errors.ocrError", { error: err }))
          }
          showOCR={true}
        />

        {conversionMode === "ai" && activeConfig && (
          <AIProviderInfo config={activeConfig} />
        )}

        <button
          onClick={handleConvert}
          disabled={isLoading || isLoadingScript || !inputText.trim()}
          className={`w-full px-6 py-3 mt-4 rounded-md text-white font-semibold transition-colors flex items-center justify-center 
            ${
              isLoading || isLoadingScript || !inputText.trim()
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                : conversionMode === "ai"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }
          `}
        >
          {(isLoading && conversionMode === "ai") ||
          (isLoadingScript && conversionMode === "script") ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : conversionMode === "ai" ? (
            <FaMagic className="mr-2" />
          ) : (
            <MdCode className="mr-2" />
          )}
          {conversionMode === "ai"
            ? isLoading
              ? t("convert.actions.aiConverting")
              : t("convert.actions.startAI")
            : isLoadingScript
            ? t("convert.actions.scriptParsing")
            : t("convert.actions.startScript")}
        </button>

        {error && (
          <div className="mt-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-start">
            <FiXCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {convertedQuestions.length > 0 && (
          <>
            <QuestionList questions={convertedQuestions} />
            <SaveToBankForm
              questionBanks={questionBanks}
              onSave={handleSave}
              disabled={convertedQuestions.length === 0}
            />
          </>
        )}

        {isSuccess && (
          <ConversionSuccess
            questionCount={convertedQuestions.length}
            bankName={savedBankName}
            onContinue={handleContinue}
            onStartPractice={() =>
              router.push(`/quiz/practice?bankId=${savedBankId}`)
            }
          />
        )}
      </div>

      <ExampleModal
        isOpen={isExampleModalOpen}
        title={getScriptExampleTitle(scriptTemplate, t)}
        content={getScriptExampleContent(scriptTemplate, i18n.language)}
        onClose={() => setIsExampleModalOpen(false)}
      />
    </div>
  );
}
