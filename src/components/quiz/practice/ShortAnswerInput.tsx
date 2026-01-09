"use client";

import { Question } from "@/types/quiz";

interface ShortAnswerInputProps {
  question: Question;
  userAnswer: string | string[] | undefined;
  showAnswer: boolean;
  onAnswerChange: (answer: string) => void;
}

export function ShortAnswerInput({
  question,
  userAnswer,
  showAnswer,
  onAnswerChange,
}: ShortAnswerInputProps) {
  const currentAnswerText = (userAnswer as string) || "";

  return (
    <div className="mt-4">
      <textarea
        value={currentAnswerText}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="在此输入您的答案..."
        rows={4}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-base"
        disabled={showAnswer}
      />
      {showAnswer && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
            参考答案:
          </p>
          <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
            {question.answer as string}
          </p>
        </div>
      )}
    </div>
  );
}
