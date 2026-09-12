"use client";

import { FaExclamationTriangle, FaTimes, FaListUl } from "react-icons/fa";
import { toast } from "sonner";
import WrongQuestionItem from "@/components/quiz/WrongQuestionItem";
import SimilarQuestionsModal from "@/components/quiz/SimilarQuestionsModal";
import { ReviewToolbar } from "@/components/quiz/review/ReviewToolbar";
import { ReviewSearchBar } from "@/components/quiz/review/ReviewSearchBar";
import { useReviewPage } from "./useReviewPage";

/**
 * Review Page (Wrong Questions Book)
 * Focuses purely on UI organization; state and handlers are extracted into useReviewPage.
 */
export default function ReviewPage() {
  const {
    t,
    router,
    questionBanks,
    searchTerm,
    setSearchTerm,
    filterBankId,
    setFilterBankId,
    viewMode,
    setViewMode,
    wrongQuestions,
    filteredQuestions,
    selectedQuestions,
    generatingExplanations,
    aiError,
    setAiError,
    handleSelectQuestion,
    handleSelectAll,
    handleStartPractice,
    handleClearRecords,
    formatDate,
    generateExplanationsForSelected,
    handleGenerateSimilarQuestions,
    totalRecordsCount,
    isSimilarQuestionsModalOpen,
    generatingSimilarQuestions,
    similarQuestionsList,
    selectedOriginalQuestionsForSimilarity,
    toggleSimilarQuestionsModal,
    importGeneratedQuestions,
  } = useReviewPage();

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
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t("review.emptyState")}</p>
          <button
            type="button"
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
        <p className="text-gray-600 dark:text-gray-400">{t("review.headerSubtitle")}</p>
      </header>

      {aiError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex justify-between items-center">
          <span>
            <FaExclamationTriangle className="inline mr-2" />
            {aiError}
          </span>
          <button
            type="button"
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
          selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0
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
        totalRecordsCount={totalRecordsCount}
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
          <p className="text-lg text-gray-600 dark:text-gray-400">{t("review.search.noResults")}</p>
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
          viewMode === "options" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
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
            ),
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
          const result = await importGeneratedQuestions(questionsToImport, bankId);
          if (result.success) {
            toast.success(
              t("review.import.success", {
                imported: result.importedCount,
                skipped: result.skippedCount,
              }),
            );
          } else {
            toast.error(t("review.import.failed", { error: result.error }));
          }
          return result;
        }}
      />
    </div>
  );
}
