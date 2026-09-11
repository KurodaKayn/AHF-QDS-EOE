"use client";

import { FaMagic, FaSpinner } from "react-icons/fa";
import { MdCode } from "react-icons/md";
import { FiXCircle } from "react-icons/fi";
import { getScriptExampleContent, getScriptExampleTitle } from "@/constants/scriptExamples";
import { ConversionModeSelector } from "@/components/quiz/ConversionModeSelector";
import { AIProviderInfo } from "@/components/quiz/AIProviderInfo";
import { TextInputArea } from "@/components/quiz/TextInputArea";
import { QuestionList } from "@/components/quiz/QuestionList";
import { SaveToBankForm } from "@/components/quiz/SaveToBankForm";
import { ConversionSuccess } from "@/components/quiz/ConversionSuccess";
import { ExampleModal } from "@/components/quiz/ExampleModal";
import { useConvertPage } from "./useConvertPage";

/**
 * Question Conversion Page
 * Focuses purely on UI organization; state and handlers are extracted into useConvertPage.
 */
export default function ConvertPage() {
  const {
    t,
    i18nLanguage,
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
    exampleQuestionText,
  } = useConvertPage();

  const getConvertButtonClass = () => {
    if (isConvertDisabled) {
      return "bg-gray-400 dark:bg-gray-600 cursor-not-allowed";
    }
    return conversionMode === "ai"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-green-600 hover:bg-green-700";
  };

  const renderConvertIcon = () => {
    if (isConverting) {
      return <FaSpinner className="animate-spin mr-2" />;
    }
    return conversionMode === "ai" ? <FaMagic className="mr-2" /> : <MdCode className="mr-2" />;
  };

  const getConvertButtonText = () => {
    if (conversionMode === "ai") {
      return isLoading ? t("convert.actions.aiConverting") : t("convert.actions.startAI");
    }
    return isLoadingScript ? t("convert.actions.scriptParsing") : t("convert.actions.startScript");
  };

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
          onLoadExample={() => setInputText(exampleQuestionText)}
          onOCRError={(err) => setError(t("convert.errors.ocrError", { error: err }))}
          showOCR
        />

        {conversionMode === "ai" && activeConfig && <AIProviderInfo config={activeConfig} />}

        <button
          type="button"
          onClick={handleConvert}
          disabled={isConvertDisabled}
          className={`w-full px-6 py-3 mt-4 rounded-md text-white font-semibold transition-colors flex items-center justify-center ${getConvertButtonClass()}`}
        >
          {renderConvertIcon()}
          {getConvertButtonText()}
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
            onStartPractice={() => router.push(`/quiz/practice?bankId=${savedBankId}`)}
          />
        )}
      </div>

      <ExampleModal
        isOpen={isExampleModalOpen}
        title={getScriptExampleTitle(scriptTemplate, t)}
        content={getScriptExampleContent(scriptTemplate, i18nLanguage)}
        onClose={() => setIsExampleModalOpen(false)}
      />
    </div>
  );
}
