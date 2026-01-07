"use client";

import { Question, QuestionType } from "@/types/quiz";
import { QUESTION_TYPE_NAMES } from "@/constants/quiz";

interface QuestionPreviewProps {
  question: Omit<Question, "id">;
  index?: number;
}

export function QuestionPreview({ question, index }: QuestionPreviewProps) {
  const { type, content, options = [], answer } = question;

  const renderAnswer = () => {
    if (
      type === QuestionType.SingleChoice &&
      typeof answer === "string" &&
      options.length > 0
    ) {
      const correctOptionIndex = options.findIndex((opt) => opt.id === answer);
      if (correctOptionIndex !== -1) {
        const optionLetter = String.fromCharCode(65 + correctOptionIndex);
        const correctOption = options[correctOptionIndex];
        return (
          <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
            答案: {optionLetter}. {correctOption.content}
          </div>
        );
      } else {
        return (
          <div className="mt-1 text-red-500 dark:text-red-400 font-medium">
            答案: (选项未找到: {answer})
          </div>
        );
      }
    } else if (
      type === QuestionType.MultipleChoice &&
      Array.isArray(answer) &&
      options.length > 0
    ) {
      const answerDetails = answer
        .map((ansId) => {
          const correctOptionIndex = options.findIndex(
            (opt) => opt.id === ansId
          );
          if (correctOptionIndex !== -1) {
            const optionLetter = String.fromCharCode(65 + correctOptionIndex);
            return `${optionLetter}. ${options[correctOptionIndex].content}`;
          }
          return null;
        })
        .filter(Boolean);

      if (answerDetails.length > 0) {
        return (
          <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
            答案: {answerDetails.join(", ")}
          </div>
        );
      } else {
        return (
          <div className="mt-1 text-red-500 dark:text-red-400 font-medium">
            答案: (选项未找到)
          </div>
        );
      }
    } else if (type === QuestionType.TrueFalse && typeof answer === "string") {
      return (
        <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
          答案: {answer === "true" ? "正确" : "错误"}
        </div>
      );
    } else if (
      type === QuestionType.ShortAnswer &&
      typeof answer === "string"
    ) {
      return (
        <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
          答案: {answer}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3 last:border-b-0 last:mb-0">
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
        <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          {QUESTION_TYPE_NAMES[type]}
        </span>
      </div>
      <p className="text-gray-900 dark:text-white">{content}</p>
      {(type === QuestionType.SingleChoice ||
        type === QuestionType.MultipleChoice) &&
        options && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {options.map((opt, i) => (
              <div
                key={opt.id}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="font-medium">
                  {String.fromCharCode(65 + i)}.
                </span>{" "}
                {opt.content}
              </div>
            ))}
          </div>
        )}
      {renderAnswer()}
    </div>
  );
}
