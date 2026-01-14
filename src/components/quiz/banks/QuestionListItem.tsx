"use client";

import { FaEdit, FaTrash } from "react-icons/fa";
import { Question, QuestionType } from "@/types/quiz";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface QuestionListItemProps {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionListItem({
  question,
  onEdit,
  onDelete,
}: QuestionListItemProps) {
  const { t, i18n } = useTranslation();
  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  const getDateLocale = () => {
    return i18n.language === "en" ? enUS : zhCN;
  };

  const renderOptions = () => {
    if (
      (question.type === QuestionType.SingleChoice ||
        question.type === QuestionType.MultipleChoice) &&
      question.options
    ) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          {question.options.map((option, index) => {
            const optionLetter = getOptionLetter(index);

            let isCorrect = false;

            if (question.type === QuestionType.SingleChoice) {
              isCorrect =
                question.answer === option.id ||
                (typeof question.answer === "string" &&
                  question.answer.toUpperCase() === optionLetter);
            } else if (question.type === QuestionType.MultipleChoice) {
              if (Array.isArray(question.answer)) {
                isCorrect =
                  question.answer.includes(option.id) ||
                  question.answer.some(
                    (ans) =>
                      typeof ans === "string" &&
                      ans.toUpperCase() === optionLetter
                  );
              }
            }

            return (
              <div
                key={option.id}
                className={`px-3 py-2 border rounded-md text-sm flex items-center ${
                  isCorrect
                    ? "bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600 text-green-800 dark:text-green-100 font-semibold shadow-sm"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${
                    isCorrect
                      ? "bg-green-500 text-white font-bold"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {optionLetter}
                </span>
                <div className="grow">
                  <span className="grow">{option.content}</span>
                </div>
                {isCorrect && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 dark:text-green-300 ml-2 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const renderAnswer = () => {
    if (question.type === QuestionType.TrueFalse) {
      return (
        <div className="text-sm mt-2 text-gray-700 dark:text-gray-300">
          {t("bankManage.item.answer")}{" "}
          <span className="font-medium text-green-600 dark:text-green-400">
            {question.answer === "true"
              ? t("aiExplanation.correct")
              : t("aiExplanation.incorrect")}
          </span>
        </div>
      );
    } else if (question.type === QuestionType.ShortAnswer) {
      return (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-white">
            {t("bankManage.item.referenceAnswer")}
          </span>{" "}
          {question.answer as string}
        </div>
      );
    } else if (question.type === QuestionType.FillInBlank) {
      return (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium text-gray-800 dark:text-white">
            {t("bankManage.item.fillInBlankAnswer")}
          </span>{" "}
          {Array.isArray(question.answer)
            ? question.answer.join(" / ")
            : (question.answer as string)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
            {t(`questionTypes.${question.type}`)}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(question)}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1"
              title={t("bankManage.item.editQuestion")}
            >
              <FaEdit size={16} />
            </button>
            <button
              onClick={() => onDelete(question.id)}
              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 p-1"
              title={t("bankManage.item.deleteQuestion")}
            >
              <FaTrash size={16} />
            </button>
          </div>
        </div>

        <div className="mb-3 text-gray-800 dark:text-white">
          {question.content}
        </div>

        {renderOptions()}
        {renderAnswer()}

        {question.explanation && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">
                {t("bankManage.item.explanation")}
              </span>{" "}
              {question.explanation}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
          {t("bankManage.item.updatedAt")}{" "}
          {formatDistanceToNow(new Date(question.updatedAt), {
            addSuffix: true,
            locale: getDateLocale(),
          })}
        </div>
      </div>
    </div>
  );
}
