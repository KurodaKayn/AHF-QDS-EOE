"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaMagic, FaSpinner } from "react-icons/fa";
import { MdCode } from "react-icons/md";
import { FiXCircle } from "react-icons/fi";
import { useQuizStore } from "@/store/quizStore";
import { EXAMPLE_QUESTION_TEXT } from "@/constants/quiz";
import { Question } from "@/types/quiz";
import { parseTextByScript, ScriptTemplate } from "@/utils/scriptParser";
import { CONVERT_SYSTEM_PROMPT, callAI } from "@/constants/ai";
import { parseQuestions } from "@/utils/questionParser";
import {
  SCRIPT_EXAMPLES,
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

export default function ConvertPage() {
  const router = useRouter();
  const {
    settings,
    questionBanks,
    addQuestionBank,
    addQuestionToBank,
    getQuestionBankById,
  } = useQuizStore();

  const { t } = useTranslation();

  // State
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<
    Omit<Question, "id">[]
  >([]);
  const [conversionMode, setConversionMode] = useState<"ai" | "script">("ai");
  const [scriptTemplate, setScriptTemplate] = useState<ScriptTemplate>(
    ScriptTemplate.ChaoXing
  );
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedBankId, setSavedBankId] = useState("");
  const [savedBankName, setSavedBankName] = useState("");

  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError(t("convert.errors.noText"));
      return;
    }
    setError(null);
    setConvertedQuestions([]);

    if (conversionMode === "script") {
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
      return;
    }

    // AI Conversion
    setIsLoading(true);
    const { aiConfigs, activeAiConfigId } = settings;
    const activeConfig = aiConfigs.find((c) => c.id === activeAiConfigId);

    if (!activeConfig || !activeConfig.apiKey) {
      setError(t("convert.errors.noAIConfig"));
      setIsLoading(false);
      return;
    }

    try {
      const messages = [
        { role: "system" as const, content: CONVERT_SYSTEM_PROMPT },
        { role: "user" as const, content: inputText },
      ];
      const response = await callAI(
        activeConfig.baseUrl,
        activeConfig.apiKey,
        activeConfig.model,
        messages
      );
      if (response) {
        const parsed = parseQuestions(response);
        if (parsed.length === 0) {
          setError(t("convert.errors.aiParseFailed"));
        } else {
          setConvertedQuestions(parsed);
        }
      }
    } catch (e: any) {
      setError(e.message || t("convert.errors.noText"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (config: {
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
      return;
    }

    convertedQuestions.forEach((q) => addQuestionToBank(targetBankId, q));
    setSavedBankId(targetBankId);
    setSavedBankName(targetBankName);
    setIsSuccess(true);
    setConvertedQuestions([]);
    setInputText("");
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleContinue = () => {
    setIsSuccess(false);
    setConvertedQuestions([]);
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
        title={getScriptExampleTitle(scriptTemplate)}
        content={SCRIPT_EXAMPLES[scriptTemplate]}
        onClose={() => setIsExampleModalOpen(false)}
      />
    </div>
  );
}
