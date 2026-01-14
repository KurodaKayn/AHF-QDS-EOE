"use client";

import { useRouter } from "next/navigation";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { PracticeHandlers } from "@/utils/practiceHandlers";
import { useThemeStore } from "@/store/themeStore";
import { QuestionType } from "@/types/quiz";
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
  const router = useRouter();
  const { theme } = useThemeStore();
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
    isCurrentQuestionAnswered,
    isLastQuestion,
    canPressNext,
    setIsNumQuestionsModalOpen,
    updateSession,
    clearPracticeSession,
    setAllBankQuestions,
    addRecord,
    removeWrongRecordsByQuestionId,
    settings,
  } = usePracticeSession();

  // ==================== Event Handlers ====================

  const handleNumQuestionsSubmit = (numToPractice: number) => {
    setIsNumQuestionsModalOpen(false);

    const questionsToSet = PracticeHandlers.preparePracticeQuestions(
      allBankQuestions.slice(0, numToPractice),
      {
        shuffleQuestionOrder: settings.shufflePracticeQuestionOrder,
        shuffleOptions: settings.shufflePracticeOptions,
      }
    );

    updateSession({
      practiceQuestions: questionsToSet,
      currentQuestionIndex: 0,
      userAnswers: {},
      showAnswer: false,
      quizCompleted: false,
      startTime: Date.now(),
    });
  };

  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion) return;

    const newAnswers = { ...userAnswers };

    if (currentQuestion.type === QuestionType.MultipleChoice) {
      const currentAnswer = (newAnswers[currentQuestion.id] as string[]) || [];
      const index = currentAnswer.indexOf(optionId);
      if (index > -1) {
        currentAnswer.splice(index, 1);
      } else {
        currentAnswer.push(optionId);
      }
      newAnswers[currentQuestion.id] = currentAnswer;
    } else {
      newAnswers[currentQuestion.id] = optionId;
    }

    updateSession({ userAnswers: newAnswers });
  };

  const handleAnswerChange = (answer: string) => {
    if (!currentQuestion) return;
    updateSession({
      userAnswers: { ...userAnswers, [currentQuestion.id]: answer },
    });
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      updateSession({
        currentQuestionIndex: currentQuestionIndex - 1,
        showAnswer: false,
      });
    }
  };

  const handleShowAnswer = () => {
    updateSession({ showAnswer: true });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      updateSession({
        currentQuestionIndex: currentQuestionIndex + 1,
        showAnswer: false,
      });
    }
  };

  const handleCompleteQuiz = () => {
    if (!startTime) return;

    const totalTime = Math.floor((Date.now() - startTime) / 1000);

    practiceQuestions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = PracticeHandlers.checkIsCorrect(question, userAnswer);

      addRecord({
        questionId: question.id,
        userAnswer: userAnswer || "",
        isCorrect,
        answeredAt: Date.now(),
      });

      if (
        isReviewMode &&
        isCorrect &&
        settings.markMistakeAsCorrectedOnReviewSuccess
      ) {
        removeWrongRecordsByQuestionId(question.id);
      }
    });

    updateSession({ quizCompleted: true });
  };

  const handleReturnToQuizList = () => {
    clearPracticeSession();
    router.push("/quiz");
  };

  const handleRetryQuiz = () => {
    if (isReviewMode) {
      clearPracticeSession();
      router.push(`/quiz/practice?bankId=${currentBank?.id}&mode=review`);
    } else {
      const questionsToSet = PracticeHandlers.preparePracticeQuestions(
        allBankQuestions,
        {
          shuffleQuestionOrder: settings.shufflePracticeQuestionOrder,
          shuffleOptions: settings.shufflePracticeOptions,
        }
      );

      updateSession({
        practiceQuestions: questionsToSet,
        currentQuestionIndex: 0,
        userAnswers: {},
        showAnswer: false,
        quizCompleted: false,
        startTime: Date.now(),
      });
    }
  };

  const handleManageBankClick = () => {
    router.push(`/quiz/banks/manage?bankId=${currentBank?.id}`);
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < practiceQuestions.length) {
      updateSession({
        currentQuestionIndex: index,
        showAnswer: false,
      });
    }
  };

  const handleReturnToBank = () => {
    // Don't clear session, user can return from sidebar to continue
    router.push("/quiz");
  };

  const handleReload = () => {
    // Clear current session, re-select question count
    updateSession({
      practiceQuestions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      showAnswer: false,
      quizCompleted: false,
      startTime: null,
    });
    setIsNumQuestionsModalOpen(true);
  };

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
        <Button onClick={handleReturnToQuizList}>
          {t("practice.backToList")}
        </Button>
      </div>
    );
  }

  if (quizCompleted) {
    const stats = PracticeHandlers.calculateStats(
      practiceQuestions,
      userAnswers
    );
    const totalTime = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;

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
            {isReviewMode
              ? t("practice.noWrongQuestions")
              : t("practice.noQuestions")}
          </p>
          <div className="flex gap-4">
            <Button onClick={handleReturnToQuizList}>
              {t("practice.backToList")}
            </Button>
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
      {/* Top-right submit button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={handleCompleteQuiz}
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
          theme={theme}
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
        />
      </div>
    </div>
  );
}
