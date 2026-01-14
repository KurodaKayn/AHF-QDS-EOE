"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Question, QuestionType } from "@/types/quiz";
import { QuestionPreview } from "./QuestionPreview";
import { useTranslation } from "react-i18next";

interface QuestionListProps {
  questions: Omit<Question, "id">[];
  maxPreview?: number;
}

export function QuestionList({ questions, maxPreview = 3 }: QuestionListProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const countByType = (type: QuestionType) =>
    questions.filter((q) => q.type === type).length;

  const displayedQuestions = showAll
    ? questions
    : questions.slice(0, maxPreview);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        {t("convert.list.title", { count: questions.length })}
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.values(QuestionType)
          .filter((type) => typeof type === "string")
          .map((type) => (
            <div
              key={type}
              className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
            >
              {t(`questionTypes.${type}`)} × {countByType(type as QuestionType)}
            </div>
          ))}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        {displayedQuestions.map((q, idx) => (
          <QuestionPreview key={idx} question={q} index={idx} />
        ))}

        {!showAll && questions.length > maxPreview && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2"
          >
            {t("convert.list.showAll", { count: questions.length })}{" "}
            <FaChevronDown className="inline ml-1" />
          </button>
        )}
        {showAll && questions.length > maxPreview && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2"
          >
            {t("convert.list.collapse")} <FaChevronUp className="inline ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
