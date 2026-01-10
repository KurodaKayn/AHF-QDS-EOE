"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { Question, QuestionBank, QuestionType } from "@/types/quiz";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";
import NumQuestionsModal from "@/components/NumQuestionsModal";
import { BeatLoader } from "react-spinners";
import { useThemeStore } from "@/store/themeStore";
import { shuffleArray } from "@/utils/array";
import { QuizHeader } from "@/components/quiz/practice/QuizHeader";
import { QuestionContent } from "@/components/quiz/practice/QuestionContent";
import { QuizControls } from "@/components/quiz/practice/QuizControls";
import { QuizCompletionSummary } from "@/components/quiz/practice/QuizCompletionSummary";
import { FaTimesCircle, FaLightbulb } from "react-icons/fa";
import { Button } from "@/components/ui/button";

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bankId = searchParams.get("bankId");
  const mode = searchParams.get("mode"); // 获取练习模式
  const isReviewMode = mode === "review"; // 是否是错题练习模式

  const {
    settings,
    getQuestionBankById,
    addRecord,
    removeWrongRecordsByQuestionId,
    records, // 获取错题记录
  } = useQuizStore();
  const { theme } = useThemeStore();

  const [currentBank, setCurrentBank] = useState<QuestionBank | null>(null);
  const [allBankQuestions, setAllBankQuestions] = useState<Question[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<
    (Question & { originalUserAnswer?: string | string[] })[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null); // 新增状态：用于存储总用时（秒）
  const [isLoading, setIsLoading] = useState(true);
  const [isNumQuestionsModalOpen, setIsNumQuestionsModalOpen] = useState(false);

  // 提前定义 currentQuestion 和相关 useMemo Hooks
  const currentQuestion = practiceQuestions[currentQuestionIndex];

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
      return isCurrentQuestionAnswered;
    } else {
      return isCurrentQuestionAnswered || showAnswer;
    }
  }, [isLastQuestion, isCurrentQuestionAnswered, showAnswer]);

  useEffect(() => {
    if (!bankId) {
      router.push("/quiz");
      return;
    }

    const bank = getQuestionBankById(bankId);
    if (bank) {
      setCurrentBank(bank);

      if (isReviewMode) {
        // 如果练习已完成，则不应在 useEffect 中自动重新开始
        // 允许总结页面显示，直到用户明确操作
        if (quizCompleted) {
          setIsLoading(false); // 确保 loading 状态解除
          return;
        }

        const wrongRecords = records.filter((r) => !r.isCorrect);
        const wrongQuestionsFromBank = bank.questions
          .filter((question) =>
            wrongRecords.some((record) => record.questionId === question.id)
          )
          .map((q) => {
            const originalRecord = wrongRecords.find(
              (r) => r.questionId === q.id
            );
            return {
              ...q,
              originalUserAnswer: originalRecord
                ? originalRecord.userAnswer
                : undefined,
            } as Question & { originalUserAnswer?: string | string[] }; // 类型断言
          });

        if (wrongQuestionsFromBank.length === 0) {
          // 如果在进入错题练习时（非完成时）就发现没有错题，则导航回错题本
          // 这个判断主要是针对初次加载或 bankId/mode 变化时
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

        setPracticeQuestions(questionsToSet);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowAnswer(false);
        setQuizCompleted(false); // 明确重置，确保开始新练习时不是完成状态
        setStartTime(Date.now());
        setIsLoading(false);
      } else {
        const loadedQuestions = bank.questions.map((q) => ({
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
      }
    } else {
      router.push("/quiz");
    }
  }, [
    bankId,
    getQuestionBankById,
    isReviewMode,
    records,
    router,
    settings.shuffleReviewOptions,
    settings.shuffleReviewQuestionOrder,
    settings.markMistakeAsCorrectedOnReviewSuccess,
    quizCompleted,
    practiceQuestions.length,
  ]); // Added router to dependency array

  const handleNumQuestionsSubmit = (numToPractice: number) => {
    setIsNumQuestionsModalOpen(false);
    let questionsToSet = [...allBankQuestions];

    // 应用题目随机排序设置
    if (settings.shufflePracticeQuestionOrder) {
      questionsToSet = shuffleArray([...questionsToSet]); // 使用更可靠的 shuffleArray 函数
    }

    const finalNumToPractice = Math.max(
      1,
      Math.min(numToPractice, questionsToSet.length)
    );
    questionsToSet = questionsToSet.slice(0, finalNumToPractice);

    // 应用选项随机排序设置
    if (settings.shufflePracticeOptions) {
      questionsToSet = questionsToSet.map((q) => {
        if (
          q.options &&
          q.type !== QuestionType.TrueFalse &&
          q.options.length > 1
        ) {
          // 深拷贝选项并随机排序，但确保不影响原始数据
          const shuffledOptions = shuffleArray([...q.options]);
          return { ...q, options: shuffledOptions };
        }
        return q;
      });
    }

    setPracticeQuestions(questionsToSet);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setQuizCompleted(false);
    setStartTime(Date.now());
  };

  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion || showAnswer) return;
    let newAnswer: string | string[];
    if (currentQuestion.type === QuestionType.MultipleChoice) {
      const currentSelected =
        (userAnswers[currentQuestion.id] as string[]) || [];
      if (currentSelected.includes(optionId)) {
        newAnswer = currentSelected.filter((id) => id !== optionId);
      } else {
        newAnswer = [...currentSelected, optionId];
      }
    } else {
      newAnswer = optionId;
    }
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: newAnswer }));
  };

  const handleAnswerChange = (answer: string) => {
    if (!currentQuestion || showAnswer) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handlePreviousQuestion = () => {
    setShowAnswer(false);
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleReturnToQuizList = () => {
    router.push("/quiz");
  };

  const handleRetryQuiz = () => {
    if (!bankId) {
      router.push("/quiz");
      return;
    }
    const bank = getQuestionBankById(bankId);
    if (!bank) {
      router.push("/quiz");
      return;
    }

    setCurrentBank(bank);
    const loadedQuestions = bank.questions.map((q) => ({
      ...q,
      options: q.options ? [...q.options] : [],
    }));
    setAllBankQuestions(loadedQuestions);
    setPracticeQuestions([]);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowAnswer(false);
    setStartTime(null);
    setIsLoading(false);

    if (isReviewMode) {
      const wrongRecords = records.filter((r) => !r.isCorrect);
      const wrongQuestionsFromBank = bank.questions
        .filter((question) =>
          wrongRecords.some((record) => record.questionId === question.id)
        )
        .map((q) => {
          const originalRecord = wrongRecords.find(
            (r) => r.questionId === q.id
          );
          return {
            ...q,
            originalUserAnswer: originalRecord
              ? originalRecord.userAnswer
              : undefined,
          } as Question & { originalUserAnswer?: string | string[] };
        });
      if (wrongQuestionsFromBank.length === 0) {
        router.push("/quiz/review");
        return;
      }
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
            return { ...q_item, options: shuffleArray([...q_item.options]) };
          }
          return q_item;
        });
      }
      setPracticeQuestions(questionsToSet);
      setStartTime(Date.now());
    } else {
      if (loadedQuestions.length > 0) {
        setIsNumQuestionsModalOpen(true);
      }
    }
  };

  const handleShowAnswer = () => {
    if (!currentQuestion) return;
    setShowAnswer(true);
  };

  const checkIsCorrect = (
    question: Question,
    userAnswer: string | string[] | undefined
  ): boolean => {
    if (userAnswer === undefined || userAnswer === null) return false;
    if (question.type === QuestionType.MultipleChoice) {
      if (!Array.isArray(question.answer) || !Array.isArray(userAnswer))
        return false;
      const correctAnswers = new Set(question.answer as string[]);
      const userAnswersSet = new Set(userAnswer as string[]);
      if (correctAnswers.size === 0 && userAnswersSet.size === 0) return true;
      return (
        correctAnswers.size === userAnswersSet.size &&
        [...correctAnswers].every((ans) => userAnswersSet.has(ans))
      );
    } else if (question.type === QuestionType.TrueFalse) {
      return (
        (userAnswer as string).toLowerCase() ===
        (question.answer as string).toLowerCase()
      );
    } else if (question.type === QuestionType.FillInBlank) {
      // 处理填空题的多答案情况
      const userAns = (userAnswer as string).trim();
      if (!userAns) return false; // 用户未作答

      // 处理标准答案
      const correctAns = question.answer as string;

      // 处理可能的多个标准答案（用分号分隔）
      if (correctAns.includes(";")) {
        // 正则表达式匹配分号，但不匹配连续分号中的前面那个
        const acceptableAnswers = correctAns.split(/;(?!;)/).map((ans) => {
          // 替换连续分号为单个分号
          return ans.replace(/;;/g, ";").trim();
        });

        // 只要用户答案匹配任何一个可接受的答案即为正确（忽略大小写）
        return acceptableAnswers.some(
          (acceptableAns) =>
            userAns.toLowerCase() === acceptableAns.toLowerCase()
        );
      }

      // 单个答案的情况
      return userAns.toLowerCase() === correctAns.toLowerCase();
    }

    // 其他类型题目
    return (
      (userAnswer as string).toLowerCase() ===
      (question.answer as string).toLowerCase()
    );
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    setShowAnswer(false);
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = () => {
    practiceQuestions.forEach((question) => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = checkIsCorrect(question, userAnswer);

      removeWrongRecordsByQuestionId(question.id);

      if (!isCorrect) {
        addRecord({
          questionId: question.id,
          userAnswer: userAnswer || "",
          isCorrect: false,
          answeredAt: Date.now(),
        });
      } else {
        if (isReviewMode && settings.markMistakeAsCorrectedOnReviewSuccess) {
          addRecord({
            questionId: question.id,
            userAnswer: userAnswer || "",
            isCorrect: true,
            answeredAt: Date.now(),
          });
        }
      }
    });
    setQuizCompleted(true);
  };

  const handleManageBankClick = () => {
    if (bankId) {
      // console.log("使用表单提交传递 bankId:", bankId);

      // 创建一个临时表单元素
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "/quiz/banks/manage/";
      form.style.display = "none";

      // 添加 bankId 作为参数
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "tempBankId";
      input.value = bankId;
      form.appendChild(input);

      // 添加到文档并提交
      document.body.appendChild(form);
      form.submit();
    }
  };

  // ----- Render Logic Starts Here -----

  if (isLoading && !isNumQuestionsModalOpen) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <BeatLoader color={theme === "dark" ? "#38BDF8" : "#3B82F6"} />
        <p className="text-gray-600 dark:text-gray-400 mt-4">加载题库中...</p>
      </div>
    );
  }

  if (isNumQuestionsModalOpen && currentBank) {
    return (
      <NumQuestionsModal
        isOpen={isNumQuestionsModalOpen}
        onClose={() => {
          setIsNumQuestionsModalOpen(false);
          if (practiceQuestions.length === 0) {
            router.back();
          }
        }}
        onSubmit={handleNumQuestionsSubmit}
        totalQuestions={allBankQuestions.length}
        bankName={currentBank.name}
      />
    );
  }

  if (!currentBank && !isLoading) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <FaTimesCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>无法加载题库或题库ID无效。</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/quiz")} className="mt-6">
          {" "}
          返回题库列表{" "}
        </Button>
      </div>
    );
  }

  if (
    practiceQuestions.length === 0 &&
    !isLoading &&
    !isNumQuestionsModalOpen &&
    currentBank
  ) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <FaLightbulb className="h-4 w-4" />
          <AlertTitle>题库为空</AlertTitle>
          <AlertDescription>此题库中没有题目。请先添加题目。</AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push(`/quiz/banks/${bankId}`)}
          className="mt-6"
        >
          返回题库详情
        </Button>
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
        onReturnToQuizList={handleReturnToQuizList}
        onRetryQuiz={handleRetryQuiz}
      />
    );
  }

  if (!currentQuestion && !isLoading) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          题目加载失败或题库为空。
        </p>
        <Button onClick={() => router.push("/quiz")} className="mt-4">
          返回题库列表
        </Button>
      </div>
    );
  }

  const isCurrentCorrect =
    currentQuestion && showAnswer
      ? checkIsCorrect(currentQuestion, userAnswers[currentQuestion.id])
      : null;

  return (
    <div className="dark:bg-gray-900 min-h-screen p-2 sm:p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-2xl animate-fade-in">
        <QuizHeader
          currentBank={currentBank}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={practiceQuestions.length}
          currentQuestionType={
            currentQuestion ? QUESTION_TYPE_NAMES[currentQuestion.type] : ""
          }
          isReviewMode={isReviewMode}
          onBack={() => router.back()}
          onManageBank={handleManageBankClick}
        />

        <CardContent className="px-4 sm:px-6 py-6 min-h-75">
          {currentQuestion && (
            <QuestionContent
              question={currentQuestion}
              userAnswer={userAnswers[currentQuestion.id]}
              showAnswer={showAnswer}
              isReviewMode={isReviewMode}
              onAnswerSelect={handleAnswerSelect}
              onAnswerChange={handleAnswerChange}
            />
          )}
        </CardContent>

        <QuizControls
          showAnswer={showAnswer}
          isCurrentCorrect={isCurrentCorrect}
          canPressNext={canPressNext}
          isLastQuestion={isLastQuestion}
          currentQuestionIndex={currentQuestionIndex}
          onShowAnswer={handleShowAnswer}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
        />
      </Card>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
          <BeatLoader
            color={
              useThemeStore.getState().theme === "dark" ? "#38BDF8" : "#3B82F6"
            }
          />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
