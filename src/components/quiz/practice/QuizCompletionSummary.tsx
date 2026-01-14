"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaArrowLeft, FaRedo } from "react-icons/fa";
import { Question, QuestionType } from "@/types/quiz";
import { QuestionOption } from "@/types/quiz";
import { useTranslation } from "react-i18next";

interface QuizCompletionSummaryProps {
  practiceQuestions: (Question & { originalUserAnswer?: string | string[] })[];
  userAnswers: Record<string, string | string[]>;
  isReviewMode: boolean;
  startTime: number | null;
  onReturnToQuizList: () => void;
  onRetryQuiz: () => void;
}

export function QuizCompletionSummary({
  practiceQuestions,
  userAnswers,
  isReviewMode,
  startTime,
  onReturnToQuizList,
  onRetryQuiz,
}: QuizCompletionSummaryProps) {
  const { t } = useTranslation();

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
      const userAns = (userAnswer as string).trim();
      if (!userAns) return false;
      const correctAns = question.answer as string;
      if (correctAns.includes(";")) {
        const acceptableAnswers = correctAns.split(/;(?!;)/).map((ans) => {
          return ans.replace(/;;/g, ";").trim();
        });
        return acceptableAnswers.some(
          (acceptableAns) =>
            userAns.toLowerCase() === acceptableAns.toLowerCase()
        );
      }
      return userAns.toLowerCase() === correctAns.toLowerCase();
    }
    return (
      (userAnswer as string).toLowerCase() ===
      (question.answer as string).toLowerCase()
    );
  };

  const getCompletionTitle = () => {
    if (isReviewMode) {
      return t("practice.completion.reviewTitle");
    }
    return t("practice.completion.title");
  };

  const correctCount = practiceQuestions.filter((q) =>
    checkIsCorrect(q, userAnswers[q.id])
  ).length;
  const totalPracticed = practiceQuestions.length;
  const accuracy =
    totalPracticed > 0 ? ((correctCount / totalPracticed) * 100).toFixed(1) : 0;
  const practiceTime = startTime
    ? ((Date.now() - startTime) / 1000).toFixed(0)
    : 0;

  const renderUserAnswerDisplay = (
    question: Question,
    userAnswer: string | string[] | undefined
  ) => {
    if (userAnswer === undefined) return t("practice.completion.notAnswered");

    if (question.type === QuestionType.MultipleChoice) {
      return Array.isArray(userAnswer) &&
        userAnswer.length > 0 &&
        question.options
        ? userAnswer
            .map(
              (ansId) =>
                (question.options || []).find((opt) => opt.id === ansId)
                  ?.content || ansId
            )
            .join(", ")
        : t("practice.completion.notAnswered");
    } else if (question.type === QuestionType.TrueFalse) {
      return userAnswer === "true"
        ? t("aiExplanation.correct")
        : userAnswer === "false"
        ? t("aiExplanation.incorrect")
        : t("practice.completion.notAnswered");
    } else if (question.options && question.options.length > 0) {
      return (
        (question.options || []).find((opt) => opt.id === userAnswer)
          ?.content ||
        (userAnswer as string) ||
        t("practice.completion.notAnswered")
      );
    } else {
      return (userAnswer as string) || t("practice.completion.notAnswered");
    }
  };

  const renderCorrectAnswerDisplay = (question: Question) => {
    if (question.type === QuestionType.MultipleChoice) {
      return Array.isArray(question.answer) && question.options
        ? question.answer
            .map(
              (ansId) =>
                (question.options || []).find((opt) => opt.id === ansId)
                  ?.content || ansId
            )
            .join(", ")
        : "N/A";
    } else if (question.type === QuestionType.TrueFalse) {
      return question.answer === "true"
        ? t("aiExplanation.correct")
        : t("aiExplanation.incorrect");
    } else if (question.options && question.options.length > 0) {
      return (
        (question.options || []).find((opt) => opt.id === question.answer)
          ?.content ||
        (question.answer as string) ||
        "N/A"
      );
    } else if (
      question.type === QuestionType.FillInBlank &&
      (question.answer as string).includes(";")
    ) {
      // Handle fill-in-the-blank multi-answer display
      const correctAns = question.answer as string;
      const acceptableAnswers = correctAns.split(/;(?!;)/).map((ans) => {
        return ans.replace(/;;/g, ";").trim();
      });
      return acceptableAnswers
        .map((ans, i) => `${t("convert.preview.answer")}${i + 1}: ${ans}`)
        .join(" | ");
    } else {
      return (question.answer as string) || "N/A";
    }
  };

  const renderOriginalWrongAnswer = (
    question: Question & { originalUserAnswer?: string | string[] }
  ) => {
    if (!question.originalUserAnswer) return null;

    const originalAns = question.originalUserAnswer;
    if (
      question.type === QuestionType.SingleChoice ||
      question.type === QuestionType.MultipleChoice
    ) {
      const currentQOptions = question.options;
      if (!currentQOptions || currentQOptions.length === 0)
        return "Missing options";

      const originalAnswerArray = Array.isArray(originalAns)
        ? originalAns
        : [originalAns].filter(Boolean);
      return (
        originalAnswerArray
          .map((ansId: string) => {
            const option = currentQOptions.find(
              (opt: QuestionOption) => opt.id === ansId
            );
            if (option) {
              const optionIndex = currentQOptions.findIndex(
                (opt: QuestionOption) => opt.id === ansId
              );
              return `${String.fromCharCode(65 + (optionIndex ?? 0))}. ${
                option.content
              }`;
            }
            return `Unknown ID: ${ansId}`;
          })
          .join(", ") || "Not recorded"
      );
    } else if (question.type === QuestionType.TrueFalse) {
      return originalAns === "true"
        ? t("aiExplanation.correct")
        : originalAns === "false"
        ? t("aiExplanation.incorrect")
        : originalAns || "Not recorded";
    } else {
      return originalAns || "Not recorded";
    }
  };

  return (
    <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-start pt-12">
      <Card className="w-full max-w-2xl text-center shadow-2xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {getCompletionTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
          <p className="text-lg text-gray-700 dark:text-gray-200">
            {t("practice.completion.message")}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-left py-4 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("practice.completion.stats.total")}:
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {totalPracticed} {t("practice.completion.stats.unit")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("practice.completion.stats.correct")}:
              </p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                {correctCount} {t("practice.completion.stats.unit")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("practice.completion.stats.accuracy")}:
              </p>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                {accuracy}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("practice.completion.stats.time")}:
              </p>
              <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {practiceTime} {t("practice.completion.stats.seconds")}
              </p>
            </div>
          </div>

          <div className="mt-6 text-left">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              {t("practice.completion.review")}:
            </h3>
            {practiceQuestions.length > 0 ? (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 border dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                {practiceQuestions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  const isCorrect = checkIsCorrect(question, userAnswer);
                  const userAnswerDisplay = renderUserAnswerDisplay(
                    question,
                    userAnswer
                  );
                  const correctAnswerDisplay =
                    renderCorrectAnswerDisplay(question);

                  return (
                    <div
                      key={question.id}
                      className={`p-3 rounded-md shadow-sm ${
                        isCorrect
                          ? "bg-green-50 dark:bg-green-900/30"
                          : "bg-red-50 dark:bg-red-900/30"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                        {index + 1}. {question.content}
                        <span
                          className={`ml-2 text-xs font-bold ${
                            isCorrect
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          (
                          {isCorrect
                            ? t("practice.completion.correct")
                            : t("practice.completion.incorrect")}
                          )
                        </span>
                      </p>

                      <p
                        className={`text-sm ${
                          isCorrect
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        <span className="font-semibold">
                          {t("practice.completion.yourAnswer")}:
                        </span>{" "}
                        {userAnswerDisplay}
                      </p>

                      {!isCorrect && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">
                            {t("practice.completion.correctAnswer")}:
                          </span>{" "}
                          {correctAnswerDisplay}
                        </p>
                      )}

                      {isReviewMode &&
                        !isCorrect &&
                        renderOriginalWrongAnswer(question) && (
                          <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                            <span className="font-semibold">
                              {t("practice.completion.originalWrong")}:
                            </span>{" "}
                            {renderOriginalWrongAnswer(question)}
                          </p>
                        )}

                      {question.explanation && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words">
                            <span className="font-semibold">
                              {t("practice.completion.explanation")}:
                            </span>{" "}
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("practice.completion.noRecords")}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
          <Button
            onClick={onReturnToQuizList}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <FaArrowLeft className="mr-2" /> {t("practice.backToList")}
          </Button>
          <Button onClick={onRetryQuiz} className="w-full sm:w-auto">
            <FaRedo className="mr-2" /> {t("practice.completion.retry")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
