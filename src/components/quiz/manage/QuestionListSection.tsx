import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Question } from "@/types/quiz";
import {
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSort,
  FaClock,
  FaClone,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

export enum QuestionSortType {
  ContentAsc = "contentAsc",
  ContentDesc = "contentDesc",
  TypeAsc = "typeAsc",
  TypeDesc = "typeDesc",
  DateAsc = "dateAsc",
  DateDesc = "dateDesc",
}

interface QuestionListSectionProps {
  questions: Question[];
  onAddQuestion: () => void;
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string, questionContent: string) => void;
  onFindDuplicates: () => void;
}

export function QuestionListSection({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onFindDuplicates,
}: QuestionListSectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<QuestionSortType>(
    QuestionSortType.ContentAsc
  );

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (searchQuery.trim()) {
      filtered = filtered.filter((q) =>
        q.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortType) {
        case QuestionSortType.ContentAsc:
          return a.content.localeCompare(b.content);
        case QuestionSortType.ContentDesc:
          return b.content.localeCompare(a.content);
        case QuestionSortType.TypeAsc:
          return a.type.localeCompare(b.type);
        case QuestionSortType.TypeDesc:
          return b.type.localeCompare(a.type);
        case QuestionSortType.DateAsc:
          return (a.createdAt || 0) - (b.createdAt || 0);
        case QuestionSortType.DateDesc:
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return a.content.localeCompare(b.content);
      }
    });
  }, [questions, searchQuery, sortType]);

  // Get translated question type name
  const getQuestionTypeName = (type: string): string => {
    const typeKey = type.toLowerCase().replace(/_/g, "_");
    return t(`questionTypes.${typeKey}`, { defaultValue: type });
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t("bankManage.questionList", {
            filtered: filteredQuestions.length,
            total: questions.length,
          })}
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onFindDuplicates}
            className="flex items-center"
          >
            <FaClone className="mr-2" /> {t("bankManage.findDuplicates")}
          </Button>
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600"
            onClick={onAddQuestion}
          >
            <FaPlusCircle className="mr-2" /> {t("bankManage.addQuestion")}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400 dark:text-gray-500" />
            </div>
            <Input
              type="text"
              placeholder={t("bankManage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={() => setSearchQuery("")}
            >
              <span className="sr-only">{t("bankManage.clear")}</span>×
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-1">
            {t("bankManage.questionSort")}:
          </span>
          <Button
            variant={
              sortType === QuestionSortType.ContentAsc ||
              sortType === QuestionSortType.ContentDesc
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setSortType(
                sortType === QuestionSortType.ContentAsc
                  ? QuestionSortType.ContentDesc
                  : QuestionSortType.ContentAsc
              )
            }
            className="text-xs"
          >
            {t("bankManage.sortByContent")}{" "}
            {sortType === QuestionSortType.ContentAsc ? (
              <FaSortAlphaDown className="ml-1" />
            ) : sortType === QuestionSortType.ContentDesc ? (
              <FaSortAlphaUp className="ml-1" />
            ) : (
              <FaSort className="ml-1" />
            )}
          </Button>

          <Button
            variant={
              sortType === QuestionSortType.TypeAsc ||
              sortType === QuestionSortType.TypeDesc
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setSortType(
                sortType === QuestionSortType.TypeAsc
                  ? QuestionSortType.TypeDesc
                  : QuestionSortType.TypeAsc
              )
            }
            className="text-xs"
          >
            {t("bankManage.sortByType")}{" "}
            {sortType === QuestionSortType.TypeAsc ? (
              <FaSortAlphaDown className="ml-1" />
            ) : sortType === QuestionSortType.TypeDesc ? (
              <FaSortAlphaUp className="ml-1" />
            ) : (
              <FaSort className="ml-1" />
            )}
          </Button>

          <Button
            variant={
              sortType === QuestionSortType.DateAsc ||
              sortType === QuestionSortType.DateDesc
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() =>
              setSortType(
                sortType === QuestionSortType.DateDesc
                  ? QuestionSortType.DateAsc
                  : QuestionSortType.DateDesc
              )
            }
            className="text-xs"
          >
            {t("bankManage.sortByAddTime")}{" "}
            {sortType === QuestionSortType.DateAsc ? (
              <FaClock className="ml-1" />
            ) : sortType === QuestionSortType.DateDesc ? (
              <FaClock className="ml-1" />
            ) : (
              <FaSort className="ml-1" />
            )}
          </Button>
        </div>
      </div>

      {filteredQuestions.length > 0 ? (
        <ul className="space-y-3">
          {filteredQuestions.map((question, index) => (
            <li
              key={question.id}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md shadow-sm flex justify-between items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {index + 1}.
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                    {getQuestionTypeName(question.type)}
                  </span>
                </div>
                <p className="font-medium text-gray-800 dark:text-gray-100 break-words">
                  {question.content}
                </p>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEditQuestion(question.id)}
                >
                  <FaEdit className="h-3.5 w-3.5" />
                  <span className="sr-only">
                    {t("bankManage.editQuestion")}
                  </span>
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onDeleteQuestion(question.id, question.content)
                  }
                >
                  <FaTrash className="h-3.5 w-3.5" />
                  <span className="sr-only">
                    {t("bankManage.deleteQuestion")}
                  </span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6">
          {searchQuery
            ? t("bankManage.noQuestionsFound")
            : t("bankManage.noQuestionsYet")}
        </p>
      )}
    </>
  );
}
