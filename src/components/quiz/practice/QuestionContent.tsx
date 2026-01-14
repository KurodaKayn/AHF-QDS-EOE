"use client";

import { Question, QuestionOption } from "@/types/quiz";
import { QuestionType } from "@/types/quiz";
import { QuestionOptions } from "./QuestionOptions";
import { TrueFalseOptions } from "./TrueFalseOptions";
import { ShortAnswerInput } from "./ShortAnswerInput";
import { FillInBlankInput } from "./FillInBlankInput";
import { useTranslation } from "react-i18next";

interface QuestionWithOriginalAnswer extends Question {
  originalUserAnswer?: string | string[];
}

interface QuestionContentProps {
  question: QuestionWithOriginalAnswer;
  userAnswer: string | string[] | undefined;
  showAnswer: boolean;
  isReviewMode: boolean;
  onAnswerSelect: (optionId: string) => void;
  onAnswerChange: (answer: string) => void;
}

export function QuestionContent({
  question,
  userAnswer,
  showAnswer,
  isReviewMode,
  onAnswerSelect,
  onAnswerChange,
}: QuestionContentProps) {
  const { t } = useTranslation();

  const renderOriginalWrongAnswer = () => {
    if (!isReviewMode || !showAnswer || !question.originalUserAnswer)
      return null;

    const originalAns = question.originalUserAnswer;

    if (
      question.type === QuestionType.SingleChoice ||
      question.type === QuestionType.MultipleChoice
    ) {
      const currentQOptions = question.options;
      if (!currentQOptions || currentQOptions.length === 0)
        return t("practice.completion.missingOptions");

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
            return `${t("practice.completion.unknownOption")}: ${ansId}`;
          })
          .join(", ") || t("practice.completion.notRecorded")
      );
    } else if (question.type === QuestionType.TrueFalse) {
      return originalAns === "true"
        ? t("aiExplanation.correct")
        : originalAns === "false"
        ? t("aiExplanation.incorrect")
        : originalAns || t("practice.completion.notRecorded");
    } else {
      return originalAns || t("practice.completion.notRecorded");
    }
  };

  return (
    <>
      <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-100 mb-4 wrap-break-word whitespace-pre-wrap leading-relaxed">
        {question.content}
      </p>

      {question.type === QuestionType.TrueFalse ? (
        <TrueFalseOptions
          question={question}
          userAnswer={userAnswer}
          showAnswer={showAnswer}
          onAnswerSelect={onAnswerSelect}
        />
      ) : question.type === QuestionType.ShortAnswer ? (
        <ShortAnswerInput
          question={question}
          userAnswer={userAnswer}
          showAnswer={showAnswer}
          onAnswerChange={onAnswerChange}
        />
      ) : question.type === QuestionType.FillInBlank ? (
        <FillInBlankInput
          question={question}
          userAnswer={userAnswer}
          showAnswer={showAnswer}
          onAnswerChange={onAnswerChange}
        />
      ) : (
        <QuestionOptions
          question={question}
          userAnswer={userAnswer}
          showAnswer={showAnswer}
          onAnswerSelect={onAnswerSelect}
        />
      )}

      {showAnswer && isReviewMode && question.originalUserAnswer && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-700">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {t("practice.completion.originalWrongReview")}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            {renderOriginalWrongAnswer()}
          </p>
        </div>
      )}

      {showAnswer && question.explanation && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
          <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {t("practice.completion.explanationTitle")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
            {question.explanation}
          </p>
        </div>
      )}
    </>
  );
}
