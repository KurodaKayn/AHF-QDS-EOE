"use client";

import { FaCheck, FaTimes } from "react-icons/fa";
import { Question, QuestionType, QuestionOption } from "@/types/quiz";
import { getTagColor } from "@/constants/quiz";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import type { Components } from "react-markdown";
import { useTranslation } from "react-i18next";

// Define extended type for wrong question display
export interface WrongQuestionDisplay extends Question {
  bankId: string;
  bankName: string;
  userAnswer: string | string[];
  answeredAt: number;
}

interface WrongQuestionItemProps {
  question: WrongQuestionDisplay | null;
  formatDate: (timestamp: number) => string;
  isSelected?: boolean;
  onSelect?: (question: WrongQuestionDisplay) => void;
  isGeneratingExplanation?: boolean;
}

/**
 * Remove markdown code fences from the beginning and end of a string.
 */
function stripMarkdownCodeFences(markdown: string): string {
  if (typeof markdown !== "string") {
    return "";
  }
  let newMarkdown = markdown.trim();
  const fenceRegex = /^```(?:[a-zA-Z0-9_\-+.]*\r?\n)?([\s\S]*?)\r?\n```$/;
  const match = newMarkdown.match(fenceRegex);
  if (match && typeof match[1] === "string") {
    newMarkdown = match[1].trim();
  } else {
    newMarkdown = markdown.trim();
  }
  return newMarkdown;
}

/**
 * Strips opening fence for streaming markdown content.
 */
function stripOpeningFenceForStream(markdown: string): string {
  if (typeof markdown !== "string") {
    return "";
  }
  let newMarkdown = markdown.trimStart();

  const fullFenceRegex = /^```(?:[a-zA-Z0-9_\-+.]*\r?\n)?([\s\S]*?)\r?\n```$/;
  const fullMatch = newMarkdown.match(fullFenceRegex);
  if (fullMatch && typeof fullMatch[1] === "string") {
    return fullMatch[1].trim();
  }

  const openingFenceStartRegex = /^```(?:[a-zA-Z0-9_\-+.]*)?(\r?\n)?/;
  const openingMatch = newMarkdown.match(openingFenceStartRegex);

  if (openingMatch) {
    let contentAfterOpeningFence = newMarkdown.substring(
      openingMatch[0].length
    );
    if (contentAfterOpeningFence.trim() === "" && !openingMatch[1]) {
      return "";
    }
    return contentAfterOpeningFence.trimStart();
  }

  return newMarkdown;
}

export default function WrongQuestionItem({
  question: q,
  formatDate,
  isSelected = false,
  onSelect,
  isGeneratingExplanation = false,
}: WrongQuestionItemProps) {
  const { t } = useTranslation();
  if (!q) return null;

  const rawExplanation = q.explanation || "";
  let markdownToDisplay;

  if (isGeneratingExplanation) {
    markdownToDisplay = stripOpeningFenceForStream(rawExplanation);
  } else {
    markdownToDisplay = stripMarkdownCodeFences(rawExplanation);
  }

  const customComponents: Components = {
    a: (props: any) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      />
    ),
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md ${
        isSelected ? "border-2 border-blue-500" : ""
      } ${isGeneratingExplanation ? "opacity-70" : ""}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-2">
          {onSelect && (
            <div
              className="flex items-center mr-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (q) onSelect(q);
              }}
            >
              <div
                className={`w-5 h-5 border rounded flex items-center justify-center ${
                  isSelected
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-400 dark:border-gray-500"
                }`}
              >
                {isSelected && <FaCheck className="text-white text-xs" />}
              </div>
            </div>
          )}
          <span
            className={`px-2 py-1 text-xs rounded-md ${getTagColor(
              t(`questionTypes.${q.type}`)
            )}`}
          >
            {t(`questionTypes.${q.type}`)}
          </span>
          <span
            className={`px-2 py-1 text-xs rounded-md ${getTagColor(
              q.bankName || t("review.item.unknownBank")
            )}`}
          >
            {q.bankName || t("review.item.unknownBank")}
          </span>
          {q.tags &&
            q.tags.length > 0 &&
            q.tags.map((tag: string) => (
              <span
                key={tag}
                className={`px-1.5 py-0.5 text-xs rounded-full ${getTagColor(
                  tag
                )}`}
              >
                {tag}
              </span>
            ))}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {t("review.item.wrongTime")}: {formatDate(q.answeredAt)}
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
        {q.content}
      </h3>

      {q.options &&
        q.options.length > 0 &&
        (q.type === QuestionType.SingleChoice ||
          q.type === QuestionType.MultipleChoice) && (
          <div className="space-y-1 mb-3 text-sm">
            {q.options.map((option: QuestionOption, idx: number) => {
              const optionId = option.id;
              const isCorrectOption = Array.isArray(q.answer)
                ? q.answer.includes(optionId)
                : q.answer === optionId;
              const isUserSelected = Array.isArray(q.userAnswer)
                ? q.userAnswer.includes(optionId)
                : q.userAnswer === optionId;
              let optionStyle =
                "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
              if (isCorrectOption) {
                optionStyle =
                  "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200";
              }
              if (isUserSelected && !isCorrectOption) {
                optionStyle =
                  "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200";
              }
              if (isUserSelected && isCorrectOption) {
                optionStyle =
                  "bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 font-semibold";
              }
              return (
                <div
                  key={option.id}
                  className={`p-2 rounded-md flex items-center ${optionStyle}`}
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{option.content}</span>
                  {isUserSelected && !isCorrectOption && (
                    <FaTimes className="inline ml-auto text-red-500 dark:text-red-400" />
                  )}
                  {isCorrectOption && !isUserSelected && (
                    <span className="ml-auto text-xs text-green-600 dark:text-green-400">
                      ({t("review.item.correctAnswer")})
                    </span>
                  )}
                  {isCorrectOption && isUserSelected && (
                    <FaCheck className="inline ml-auto text-green-600 dark:text-green-400" />
                  )}
                </div>
              );
            })}
          </div>
        )}

      {q.type === QuestionType.TrueFalse && (
        <div className="text-sm mb-3">
          <p
            className={`${
              q.userAnswer === q.answer
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {t("review.item.yourAnswer")}:{" "}
            {q.userAnswer === "true"
              ? t("aiExplanation.correct")
              : t("aiExplanation.incorrect")}
          </p>
          <p className="text-green-600 dark:text-green-400">
            {t("review.item.correctAnswer")}:{" "}
            {q.answer === "true"
              ? t("aiExplanation.correct")
              : t("aiExplanation.incorrect")}
          </p>
        </div>
      )}

      {q.type === QuestionType.ShortAnswer && (
        <div className="text-sm mb-3">
          <div className="p-2 rounded-md bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 mb-1">
            <span className="font-medium">{t("review.item.yourAnswer")}: </span>
            {Array.isArray(q.userAnswer)
              ? q.userAnswer.join(", ")
              : q.userAnswer || t("review.item.notAnswered")}
          </div>
          <div className="p-2 rounded-md bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
            <span className="font-medium">
              {t("review.item.correctAnswer")}:{" "}
            </span>
            {typeof q.answer === "string"
              ? q.answer
              : Array.isArray(q.answer)
              ? q.answer.join(", ")
              : ""}
          </div>
        </div>
      )}

      {markdownToDisplay && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {t("review.item.explanation")}:
          </p>
          <div className="text-sm text-gray-600 dark:text-gray-400 prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown
              key={`markdown-${q.id}-${markdownToDisplay.length}-${isGeneratingExplanation}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={customComponents}
            >
              {markdownToDisplay}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {isGeneratingExplanation && !markdownToDisplay && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {t("review.item.generatingAiExplanation")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
