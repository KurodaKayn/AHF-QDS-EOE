import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PracticeHandlers, QuestionType, useQuizStore, type Question } from "@/model/quiz";
import { useTranslation } from "react-i18next";
import { persistPracticeResults } from "./persistPracticeResults";

/**
 * Custom Hook: Manages practice session state
 * Provides state persistence and recovery functionality
 */
export function usePracticeSession() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const bankId = searchParams.get("bankId");
  const mode = searchParams.get("mode");
  const isReviewMode = mode === "review";

  const {
    settings,
    getQuestionBankById,
    addRecord,
    removeWrongRecordsByQuestionId,
    records,
    practiceSession,
    setPracticeSession,
    clearPracticeSession,
  } = useQuizStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isNumQuestionsModalOpen, setIsNumQuestionsModalOpen] = useState(false);
  const [allBankQuestions, setAllBankQuestions] = useState<Question[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Restore state from store
  const currentBank = bankId ? getQuestionBankById(bankId) : null;
  const practiceQuestions = practiceSession.practiceQuestions;
  const currentQuestionIndex = practiceSession.currentQuestionIndex;
  const userAnswers = practiceSession.userAnswers;
  const showAnswer = practiceSession.showAnswer;
  const quizCompleted = practiceSession.quizCompleted;
  const startTime = practiceSession.startTime;

  const currentQuestion = practiceQuestions[currentQuestionIndex];

  // Calculate derived state
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion || !userAnswers[currentQuestion.id]) return false;
    const answer = userAnswers[currentQuestion.id];
    return Array.isArray(answer) ? answer.length > 0 : answer !== "";
  }, [currentQuestion, userAnswers]);

  const isLastQuestion = useMemo(
    () => currentQuestionIndex === practiceQuestions.length - 1 && practiceQuestions.length > 0,
    [currentQuestionIndex, practiceQuestions.length],
  );

  const canPressNext = useMemo(() => {
    if (isLastQuestion) {
      // Last question must be answered to complete
      return isCurrentQuestionAnswered;
    } else {
      // Always allow Next for non-last questions
      return true;
    }
  }, [isLastQuestion, isCurrentQuestionAnswered]);

  const initializeReviewMode = useCallback(
    (bank: any) => {
      if (quizCompleted) {
        setIsLoading(false);
        return;
      }

      const wrongRecords = records.filter((r) => !r.isCorrect);
      const wrongQuestionsFromBank = bank.questions
        .filter((question: Question) =>
          wrongRecords.some((record) => record.questionId === question.id),
        )
        .map((q: Question) => {
          const originalRecord = wrongRecords.find((r) => r.questionId === q.id);
          return {
            ...q,
            originalUserAnswer: originalRecord ? originalRecord.userAnswer : undefined,
          };
        });

      if (wrongQuestionsFromBank.length === 0) {
        router.push("/quiz/review");
        return;
      }

      setAllBankQuestions(wrongQuestionsFromBank);
      let questionsToSet = [...wrongQuestionsFromBank];

      if (settings.shuffleReviewQuestionOrder) {
        questionsToSet = PracticeHandlers.shuffleArray([...questionsToSet]);
      }

      if (settings.shuffleReviewOptions) {
        questionsToSet = questionsToSet.map((q_item) => {
          if (
            q_item.options &&
            q_item.type !== QuestionType.TrueFalse &&
            q_item.options.length > 1
          ) {
            const shuffledOptions = PracticeHandlers.shuffleArray([...q_item.options]);
            return { ...q_item, options: shuffledOptions };
          }
          return q_item;
        });
      }

      setPracticeSession({
        bankId: bankId ?? undefined,
        mode: "review",
        practiceQuestions: questionsToSet,
        currentQuestionIndex: 0,
        userAnswers: {},
        showAnswer: false,
        quizCompleted: false,
        startTime: Date.now(),
      });

      setIsLoading(false);
    },
    [
      bankId,
      quizCompleted,
      records,
      router,
      setPracticeSession,
      settings.shuffleReviewOptions,
      settings.shuffleReviewQuestionOrder,
    ],
  );

  const initializeNormalMode = useCallback(
    (bank: any) => {
      const loadedQuestions = bank.questions.map((q: Question) => ({
        ...q,
        options: q.options ? [...q.options] : [],
      }));

      setAllBankQuestions(loadedQuestions);

      if (practiceQuestions.length === 0 && loadedQuestions.length > 0 && !quizCompleted) {
        setIsNumQuestionsModalOpen(true);
      }

      setIsLoading(false);
    },
    [practiceQuestions.length, quizCompleted],
  );

  // Initialize or restore session
  useEffect(() => {
    if (!bankId) {
      router.push("/quiz");
      return;
    }

    const bank = getQuestionBankById(bankId);
    if (!bank) {
      router.push("/quiz");
      return;
    }

    // Check if there's an existing session to restore
    const hasExistingSession =
      practiceSession.bankId === bankId &&
      practiceSession.mode === (isReviewMode ? "review" : "normal") &&
      practiceSession.practiceQuestions.length > 0;

    if (hasExistingSession && !quizCompleted) {
      const loadedQuestions = bank.questions.map((q: Question) => ({
        ...q,
        options: q.options ? [...q.options] : [],
      }));
      setAllBankQuestions(loadedQuestions);
      setIsLoading(false);
      return;
    }

    // Start new session
    if (isReviewMode) {
      initializeReviewMode(bank);
    } else {
      initializeNormalMode(bank);
    }
  }, [
    bankId,
    isReviewMode,
    getQuestionBankById,
    router,
    practiceSession.bankId,
    practiceSession.mode,
    practiceSession.practiceQuestions.length,
    quizCompleted,
    initializeReviewMode,
    initializeNormalMode,
  ]);

  /**
   * Start a normal practice session with selected question count
   */
  const handleNumQuestionsSubmit = useCallback(
    (numToPractice: number) => {
      setIsNumQuestionsModalOpen(false);

      const questionsToSet = PracticeHandlers.preparePracticeQuestions(
        allBankQuestions.slice(0, numToPractice),
        {
          shuffleQuestionOrder: settings.shufflePracticeQuestionOrder,
          shuffleOptions: settings.shufflePracticeOptions,
        },
      );

      setPracticeSession({
        bankId: bankId ?? undefined,
        mode: "normal",
        practiceQuestions: questionsToSet,
        currentQuestionIndex: 0,
        userAnswers: {},
        showAnswer: false,
        quizCompleted: false,
        startTime: Date.now(),
      });
    },
    [
      allBankQuestions,
      bankId,
      settings.shufflePracticeOptions,
      settings.shufflePracticeQuestionOrder,
      setPracticeSession,
    ],
  );

  const handleAnswerSelect = useCallback(
    (optionId: string) => {
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

      setPracticeSession({ userAnswers: newAnswers });
    },
    [currentQuestion, userAnswers, setPracticeSession],
  );

  const handleAnswerChange = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;
      setPracticeSession({
        userAnswers: { ...userAnswers, [currentQuestion.id]: answer },
      });
    },
    [currentQuestion, userAnswers, setPracticeSession],
  );

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setPracticeSession({
        currentQuestionIndex: currentQuestionIndex - 1,
        showAnswer: false,
      });
    }
  }, [currentQuestionIndex, setPracticeSession]);

  const handleShowAnswer = useCallback(() => {
    setPracticeSession({ showAnswer: true });
  }, [setPracticeSession]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setPracticeSession({
        currentQuestionIndex: currentQuestionIndex + 1,
        showAnswer: false,
      });
    }
  }, [currentQuestionIndex, practiceQuestions.length, setPracticeSession]);

  const handleJumpToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < practiceQuestions.length) {
        setPracticeSession({
          currentQuestionIndex: index,
          showAnswer: false,
        });
      }
    },
    [practiceQuestions.length, setPracticeSession],
  );

  const handleCompleteQuiz = useCallback(async () => {
    if (!startTime || isCompleting || quizCompleted) return;

    setIsCompleting(true);
    setCompletionError(null);
    try {
      await persistPracticeResults({
        questions: practiceQuestions,
        userAnswers,
        isReviewMode,
        removeCorrectedMistakes: settings.markMistakeAsCorrectedOnReviewSuccess,
        addRecord,
        removeWrongRecordsByQuestionId,
      });
      setPracticeSession({ quizCompleted: true });
    } catch {
      setCompletionError(t("practice.saveFailed"));
    } finally {
      setIsCompleting(false);
    }
  }, [
    startTime,
    practiceQuestions,
    userAnswers,
    addRecord,
    isReviewMode,
    settings.markMistakeAsCorrectedOnReviewSuccess,
    removeWrongRecordsByQuestionId,
    setPracticeSession,
    isCompleting,
    quizCompleted,
    t,
  ]);

  const handleReturnToQuizList = useCallback(() => {
    clearPracticeSession();
    router.push("/quiz");
  }, [clearPracticeSession, router]);

  const handleReturnToBank = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  const handleManageBankClick = useCallback(() => {
    router.push(`/quiz/banks/manage?bankId=${currentBank?.id}`);
  }, [currentBank?.id, router]);

  const handleRetryQuiz = useCallback(() => {
    if (isReviewMode) {
      clearPracticeSession();
      router.push(`/quiz/practice?bankId=${currentBank?.id}&mode=review`);
    } else {
      const questionsToSet = PracticeHandlers.preparePracticeQuestions(allBankQuestions, {
        shuffleQuestionOrder: settings.shufflePracticeQuestionOrder,
        shuffleOptions: settings.shufflePracticeOptions,
      });

      setPracticeSession({
        bankId: bankId ?? undefined,
        mode: "normal",
        practiceQuestions: questionsToSet,
        currentQuestionIndex: 0,
        userAnswers: {},
        showAnswer: false,
        quizCompleted: false,
        startTime: Date.now(),
      });
    }
  }, [
    isReviewMode,
    clearPracticeSession,
    router,
    currentBank?.id,
    allBankQuestions,
    settings.shufflePracticeQuestionOrder,
    settings.shufflePracticeOptions,
    setPracticeSession,
    bankId,
  ]);

  const handleReload = useCallback(() => {
    setPracticeSession({
      bankId: bankId ?? undefined,
      mode: isReviewMode ? "review" : "normal",
      practiceQuestions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      showAnswer: false,
      quizCompleted: false,
      startTime: null,
    });
    setIsNumQuestionsModalOpen(true);
  }, [bankId, isReviewMode, setPracticeSession]);

  return {
    // State
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

    // Derived State
    isCurrentQuestionAnswered,
    isLastQuestion,
    canPressNext,

    // Actions & Methods
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
  };
}
