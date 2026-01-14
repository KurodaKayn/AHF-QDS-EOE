"use client";

import { Question, QuestionType } from "@/types/quiz";
import { QuestionContent } from "./QuestionContent";
import { Button } from "@/components/ui/button";
import { FaLightbulb } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface QuestionDisplayProps {
  question: Question & { originalUserAnswer?: string | string[] };
  userAnswer: string | string[] | undefined;
  showAnswer: boolean;
  isReviewMode: boolean;
  onAnswerSelect: (optionId: string) => void;
  onAnswerChange: (answer: string) => void;
  onShowAnswer: () => void;
  theme: string;
}

/**
 * Question display component
 * Integrates question content and show answer button
 */
export function QuestionDisplay({
  question,
  userAnswer,
  showAnswer,
  isReviewMode,
  onAnswerSelect,
  onAnswerChange,
  onShowAnswer,
  theme,
}: QuestionDisplayProps) {
  const { t } = useTranslation();

  if (!question) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-gray-500">
          {t("practice.loadingQuestions")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* Question type tag */}
        <div className="mb-4">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {t(`questionTypes.${question.type}`)}
          </span>
        </div>

        {/* Question content */}
        <QuestionContent
          question={question}
          userAnswer={userAnswer}
          showAnswer={showAnswer}
          isReviewMode={isReviewMode}
          onAnswerSelect={onAnswerSelect}
          onAnswerChange={onAnswerChange}
        />

        {/* Show answer button */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={onShowAnswer}
            disabled={showAnswer}
            className="w-full sm:w-auto"
          >
            <FaLightbulb className="mr-2" />
            {showAnswer ? t("practice.answerShown") : t("practice.showAnswer")}
          </Button>
        </div>
      </div>
    </div>
  );
}
