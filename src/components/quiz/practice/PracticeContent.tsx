"use client";

import { usePracticeSession } from "./usePracticeSession";
import { QuizCompletionSummary } from "@/components/quiz/practice/QuizCompletionSummary";
import { QuestionDisplay } from "@/components/quiz/practice/QuestionDisplay";
import { QuestionNavigation } from "@/components/quiz/practice/QuestionNavigation";
import { NumQuestionsModal } from "@/components/quiz/practice/NumQuestionsModal";
import { Button } from "@/components/ui/button";
import { FaTimesCircle, FaPaperPlane } from "react-icons/fa";
import { useTranslation } from "react-i18next";

/**
 * Practice content component
 * Uses persistent state, supports session recovery
 */
export function PracticeContent() {
  const { t } = useTranslation();

  const {
    currentBank,
    allBankQuestions,
    practiceQuestions,
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    showAnswer,
    quizCompleted,
    startTime,
    isLoading,
    isNumQuestionsModalOpen,
    isReviewMode,
    isCompleting,
    completionError,
    isLastQuestion,
    canPressNext,
    setIsNumQuestionsModalOpen,
    handleNumQuestionsSubmit,
    handleAnswerSelect,
    handleAnswerChange,
    handlePreviousQuestion,
    handleShowAnswer,
    handleNextQuestion,
    handleJumpToQuestion,
    handleCompleteQuiz,
    handleReturnToQuizList,
    handleReturnToBank,
    handleManageBankClick,
    handleRetryQuiz,
    handleReload,
  } = usePracticeSession();

  // ==================== Render ====================

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">{t("practice.loading")}</div>
      </div>
    );
  }

  if (!currentBank) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <FaTimesCircle className="text-6xl text-red-500" />
        <p className="text-xl">{t("practice.bankNotFound")}</p>
        <Button onClick={handleReturnToQuizList}>{t("practice.backToList")}</Button>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <QuizCompletionSummary
        practiceQuestions={practiceQuestions}
        userAnswers={userAnswers}
        isReviewMode={isReviewMode}
        startTime={startTime}
        onRetryQuiz={handleRetryQuiz}
        onReturnToQuizList={handleReturnToQuizList}
      />
    );
  }

  if (practiceQuestions.length === 0) {
    return (
      <>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <p className="text-xl">
            {isReviewMode ? t("practice.noWrongQuestions") : t("practice.noQuestions")}
          </p>
          <div className="flex gap-4">
            <Button onClick={handleReturnToQuizList}>{t("practice.backToList")}</Button>
            {!isReviewMode && (
              <Button onClick={handleManageBankClick} variant="outline">
                {t("practice.manageBank")}
              </Button>
            )}
          </div>
        </div>
        <NumQuestionsModal
          isOpen={isNumQuestionsModalOpen}
          onClose={() => setIsNumQuestionsModalOpen(false)}
          onSubmit={handleNumQuestionsSubmit}
          maxQuestions={allBankQuestions.length}
        />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col absolute inset-0">
      {completionError && (
        <p className="absolute top-4 left-4 z-10 rounded bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/50 dark:text-red-200">
          {completionError}
        </p>
      )}
      {/* Top-right submit button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={handleCompleteQuiz}
          disabled={isCompleting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-lg"
          title={t("practice.submitAndFinish")}
        >
          <FaPaperPlane />
          {t("practice.submit")}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <QuestionDisplay
          question={currentQuestion}
          userAnswer={userAnswers[currentQuestion?.id]}
          showAnswer={showAnswer}
          isReviewMode={isReviewMode}
          onAnswerSelect={handleAnswerSelect}
          onAnswerChange={handleAnswerChange}
          onShowAnswer={handleShowAnswer}
        />
      </div>

      <div className="flex-shrink-0">
        <QuestionNavigation
          currentIndex={currentQuestionIndex}
          totalQuestions={practiceQuestions.length}
          isLastQuestion={isLastQuestion}
          canPressNext={canPressNext}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
          onComplete={handleCompleteQuiz}
          onJumpTo={handleJumpToQuestion}
          onReturnToBank={handleReturnToBank}
          onReload={handleReload}
          isCompleting={isCompleting}
        />
      </div>
    </div>
  );
}
