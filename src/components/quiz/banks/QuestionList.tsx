"use client";

import { Button } from "@/components/ui/button";
import { Question } from "@/types/quiz";
import { QuestionListItem } from "./QuestionListItem";
import { useTranslation } from "react-i18next";

interface QuestionListProps {
  questions: Question[];
  searchTerm: string;
  filterType: string;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onClearFilters: () => void;
}

export function QuestionList({
  questions,
  searchTerm,
  filterType,
  onEditQuestion,
  onDeleteQuestion,
  onClearFilters,
}: QuestionListProps) {
  const { t } = useTranslation();

  if (questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filterType !== "all"
              ? t("bankManage.noQuestionsFound")
              : t("bankManage.noQuestions")}
          </p>
          {(searchTerm || filterType !== "all") && (
            <Button onClick={onClearFilters}>
              {t("bankManage.clearFilters")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionListItem
            key={question.id}
            question={question}
            onEdit={onEditQuestion}
            onDelete={onDeleteQuestion}
          />
        ))}
      </div>
    </div>
  );
}
