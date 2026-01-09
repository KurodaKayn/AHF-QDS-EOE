"use client";

import { Button } from "@/components/ui/button";
import { Question } from "@/types/quiz";
import { QuestionListItem } from "./QuestionListItem";

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
  if (questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filterType !== "all"
              ? "没有符合条件的题目。尝试调整搜索条件或过滤器。"
              : '此题库中暂无题目。点击上方的"添加新题目"按钮开始创建。'}
          </p>
          {(searchTerm || filterType !== "all") && (
            <Button onClick={onClearFilters}>清除过滤条件</Button>
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
