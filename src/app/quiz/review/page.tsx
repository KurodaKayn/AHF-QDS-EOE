"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaExclamationTriangle, FaTimes, FaListUl } from "react-icons/fa";
import { toast } from "sonner";
import { useQuizStore } from "@/store/quizStore";
import { Question } from "@/types/quiz";
import WrongQuestionItem, {
  WrongQuestionDisplay,
} from "@/components/quiz/WrongQuestionItem";
import SimilarQuestionsModal from "@/components/quiz/SimilarQuestionsModal";
import { useTranslation } from "react-i18next";
import { useAiExplanation } from "@/hooks/useAiExplanation";
import { useReviewLogic } from "@/hooks/useReviewLogic";
import { ReviewToolbar } from "@/components/quiz/review/ReviewToolbar";
import { ReviewSearchBar } from "@/components/quiz/review/ReviewSearchBar";

/**
 * Review Page (Wrong Questions Book)
 * Refactored version with separated UI and business logic
 */
export default function ReviewPage() {
  const router = useRouter();
  const {
    questionBanks,
    records,
    clearRecords,
    updateQuestionInBank,
    settings,
    isSimilarQuestionsModalOpen,
    generatingSimilarQuestions,
    similarQuestionsList,
    selectedOriginalQuestionsForSimilarity,
    toggleSimilarQuestionsModal,
    setSelectedOriginalQuestionsForSimilarity,
    generateSimilarQuestions,
    importGeneratedQuestions,
  } = useQuizStore();
  const { t } = useTranslation();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBankId, setFilterBankId] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"options" | "list">("options");

  // AI explanation logic
  const {
    generatingExplanations,
    aiError,
    currentExplanations,
    completedExplanations,
    setAiError,
    generateExplanation,
    cleanupExplanations,
  } = useAiExplanation();

  /**
   * Aggregate wrong questions information
   */
  const wrongQuestions = useMemo(() => {
    const wrongRecords = records.filter((record) => !record.isCorrect);
    const questions = wrongRecords
      .map((record) => {
        for (const bank of questionBanks) {
          const question = bank.questions.find(
            (q) => q.id === record.questionId
          );
          if (question) {
            const wrongQuestionDisplayItem: WrongQuestionDisplay = {
              ...question,
              bankId: bank.id,
              bankName: bank.name,
              userAnswer: record.userAnswer,
              answeredAt: record.answeredAt,
            };
            return wrongQuestionDisplayItem;
          }
        }
        return null;
      })
      .filter((q): q is WrongQuestionDisplay => q !== null);
    return questions.sort((a, b) => b.answeredAt - a.answeredAt);
  }, [questionBanks, records]);

  // Review page business logic
  const {
    filteredQuestions,
    selectedQuestions,
    handleSelectQuestion,
    handleSelectAll,
    clearSelection,
    getSelectedQuestions,
  } = useReviewLogic({
    wrongQuestions,
    filterBankId,
    searchTerm,
    currentExplanations,
    completedExplanations,
  });

  // Clean up explanation cache when filtered questions change
  useEffect(() => {
    const validIds = new Set(filteredQuestions.map((q) => q.id));
    cleanupExplanations(validIds);
  }, [filteredQuestions, cleanupExplanations]);

  /**
   * Handle start practice with wrong questions
   */
  const handleStartPractice = () => {
    const wrongRecs = records.filter((record) => !record.isCorrect);
    if (wrongRecs.length === 0) {
      toast.info(t("review.alerts.noWrongQuestions"));
      return;
    }
    const bankWithWrong = questionBanks.find((bank) =>
      bank.questions.some((q) => wrongRecs.some((r) => r.questionId === q.id))
    );
    if (bankWithWrong) {
      router.push(`/quiz/practice?bankId=${bankWithWrong.id}&mode=review`);
    } else {
      toast.warning(t("review.alerts.noBankWithWrong"));
    }
  };

  /**
   * Clear wrong questions records
   */
  const handleClearRecords = () => {
    if (confirm(t("review.alerts.confirmClear"))) {
      clearRecords();
      clearSelection();
    }
  };

  /**
   * Format timestamp to date string
   */
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  /**
   * Generate AI explanations for selected questions
   */
  const generateExplanationsForSelected = async () => {
    if (selectedQuestions.size === 0) {
      toast.warning(t("review.alerts.selectToExplain"));
      return;
    }

    const { aiConfigs, activeAiConfigId } = settings;
    const activeConfig = aiConfigs.find((c) => c.id === activeAiConfigId);

    if (!activeConfig) {
      setAiError(t("review.ai.noModel"));
      return;
    }

    if (!activeConfig.apiKey) {
      setAiError(t("review.ai.configKey", { name: activeConfig.name }));
      return;
    }

    setAiError(null);
    const selectedItems = getSelectedQuestions();

    for (const questionInfo of selectedItems) {
      await generateExplanation(
        questionInfo,
        {
          baseUrl: activeConfig.baseUrl,
          apiKey: activeConfig.apiKey,
          model: activeConfig.model,
        },
        (questionId, explanation) => {
          // Save to question bank
          if (questionInfo.bankId) {
            updateQuestionInBank(questionInfo.bankId, questionId, {
              explanation,
            });
          }
        }
      );
    }
  };

  /**
   * Generate similar questions using AI
   */
  const handleGenerateSimilarQuestions = async () => {
    if (selectedQuestions.size === 0) {
      toast.warning(t("review.alerts.selectToSimilar"));
      return;
    }
    const selectedItems = getSelectedQuestions();
    if (selectedItems.length === 0) {
      toast.warning(t("review.alerts.noDetailsFound"));
      return;
    }

    // Map WrongQuestionDisplay[] to Question[]
    const questionsForAI: Question[] = selectedItems.map((q) => ({
      id: q.id,
      type: q.type,
      content: q.content,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      tags: q.tags,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));

    setSelectedOriginalQuestionsForSimilarity(questionsForAI);
    await generateSimilarQuestions(questionsForAI);
  };

  // Empty state
  if (wrongQuestions.length === 0 && viewMode === "options") {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t("review.pageTitle")}
          </h1>
        </div>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t("review.emptyState")}
          </p>
          <button
            onClick={() => router.push("/quiz")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md"
          >
            {t("review.returnToHome")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {t("review.headerTitle")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("review.headerSubtitle")}
        </p>
      </header>

      {aiError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex justify-between items-center">
          <span>
            <FaExclamationTriangle className="inline mr-2" />
            {aiError}
          </span>
          <button
            onClick={() => setAiError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-100"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Action toolbar */}
      <ReviewToolbar
        wrongQuestionsCount={wrongQuestions.length}
        filteredQuestionsCount={filteredQuestions.length}
        selectedCount={selectedQuestions.size}
        isAllSelected={
          selectedQuestions.size === filteredQuestions.length &&
          filteredQuestions.length > 0
        }
        isGenerating={generatingExplanations.size > 0}
        generatingCount={generatingExplanations.size}
        isSimilarGenerating={generatingSimilarQuestions}
        onStartPractice={handleStartPractice}
        onSelectAll={handleSelectAll}
        onGenerateExplanations={generateExplanationsForSelected}
        onGenerateSimilar={handleGenerateSimilarQuestions}
        onClearRecords={handleClearRecords}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalRecordsCount={records.length}
      />

      {/* Search and filter bar */}
      <ReviewSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterBankId={filterBankId}
        onFilterChange={setFilterBankId}
        questionBanks={questionBanks}
      />

      {/* Questions list */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-10">
          <FaListUl className="mx-auto text-5xl text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t("review.search.noResults")}
          </p>
          {wrongQuestions.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t("review.search.noResultsHint")}
            </p>
          )}
          {wrongQuestions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t("review.search.greatNoMistakes")}
            </p>
          )}
        </div>
      )}

      <div
        className={`grid gap-4 ${
          viewMode === "options"
            ? "md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {filteredQuestions.map(
          (q) =>
            q && (
              <WrongQuestionItem
                key={q.id}
                question={q}
                formatDate={formatDate}
                isSelected={selectedQuestions.has(q.id)}
                onSelect={() => handleSelectQuestion(q)}
                isGeneratingExplanation={generatingExplanations.has(q.id)}
              />
            )
        )}
      </div>

      {/* Similar Questions Modal */}
      <SimilarQuestionsModal
        isOpen={isSimilarQuestionsModalOpen}
        onClose={() => toggleSimilarQuestionsModal(false)}
        originalQuestions={selectedOriginalQuestionsForSimilarity}
        generatedQuestions={similarQuestionsList}
        isLoading={generatingSimilarQuestions}
        availableBanks={questionBanks}
        onImport={async (questionsToImport, bankId) => {
          const result = await importGeneratedQuestions(
            questionsToImport,
            bankId
          );
          if (result.success) {
            toast.success(
              t("review.import.success", {
                imported: result.importedCount,
                skipped: result.skippedCount,
              })
            );
          } else {
            toast.error(t("review.import.failed", { error: result.error }));
          }
        }}
      />
    </div>
  );
}
