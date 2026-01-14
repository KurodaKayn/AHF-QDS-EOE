import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { Question, QuestionType } from "@/types/quiz";

/**
 * Custom Hook: Manages practice session state
 * Provides state persistence and recovery functionality
 */
export function usePracticeSession() {
  const router = useRouter();
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
    () =>
      currentQuestionIndex === practiceQuestions.length - 1 &&
      practiceQuestions.length > 0,
    [currentQuestionIndex, practiceQuestions.length]
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
      // Restore existing session
      setIsLoading(false);
      return;
    }

    // Start new session
    if (isReviewMode) {
      initializeReviewMode(bank);
    } else {
      initializeNormalMode(bank);
    }
  }, [bankId, isReviewMode]);

  const initializeReviewMode = (bank: any) => {
    if (quizCompleted) {
      setIsLoading(false);
      return;
    }

    const wrongRecords = records.filter((r) => !r.isCorrect);
    const wrongQuestionsFromBank = bank.questions
      .filter((question: Question) =>
        wrongRecords.some((record) => record.questionId === question.id)
      )
      .map((q: Question) => {
        const originalRecord = wrongRecords.find((r) => r.questionId === q.id);
        return {
          ...q,
          originalUserAnswer: originalRecord
            ? originalRecord.userAnswer
            : undefined,
        };
      });

    if (wrongQuestionsFromBank.length === 0) {
      router.push("/quiz/review");
      return;
    }

    setAllBankQuestions(wrongQuestionsFromBank);
    let questionsToSet = [...wrongQuestionsFromBank];

    if (settings.shuffleReviewQuestionOrder) {
      questionsToSet = shuffleArray([...questionsToSet]);
    }

    if (settings.shuffleReviewOptions) {
      questionsToSet = questionsToSet.map((q_item) => {
        if (
          q_item.options &&
          q_item.type !== QuestionType.TrueFalse &&
          q_item.options.length > 1
        ) {
          const shuffledOptions = shuffleArray([...q_item.options]);
          return { ...q_item, options: shuffledOptions };
        }
        return q_item;
      });
    }

    setPracticeSession({
      bankId,
      mode: "review",
      practiceQuestions: questionsToSet,
      currentQuestionIndex: 0,
      userAnswers: {},
      showAnswer: false,
      quizCompleted: false,
      startTime: Date.now(),
    });

    setIsLoading(false);
  };

  const initializeNormalMode = (bank: any) => {
    const loadedQuestions = bank.questions.map((q: Question) => ({
      ...q,
      options: q.options ? [...q.options] : [],
    }));

    setAllBankQuestions(loadedQuestions);

    if (
      practiceQuestions.length === 0 &&
      loadedQuestions.length > 0 &&
      !quizCompleted
    ) {
      setIsNumQuestionsModalOpen(true);
    }

    setIsLoading(false);
  };

  /**
   * Shuffles an array using Fisher-Yates algorithm
   */
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * Helper function to update practice session state
   */
  const updateSession = useCallback(
    (updates: Partial<typeof practiceSession>) => {
      setPracticeSession(updates);
    },
    [setPracticeSession]
  );

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

    // Derived State
    isCurrentQuestionAnswered,
    isLastQuestion,
    canPressNext,

    // Methods
    setIsNumQuestionsModalOpen,
    updateSession,
    clearPracticeSession,
    setAllBankQuestions,
    addRecord,
    removeWrongRecordsByQuestionId,
    settings,
  };
}
