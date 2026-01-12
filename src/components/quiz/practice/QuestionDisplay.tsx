"use client";

import { Question, QuestionType } from "@/types/quiz";
import { QuestionContent } from "./QuestionContent";
import { Button } from "@/components/ui/button";
import { FaLightbulb } from "react-icons/fa";

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
 * 题目显示组件
 * 整合题目内容和查看答案按钮
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
  if (!question) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-gray-500">加载题目中...</p>
      </div>
    );
  }

  // 获取题型显示文本
  const getQuestionTypeText = (type: QuestionType): string => {
    switch (type) {
      case QuestionType.SingleChoice:
        return "单选题";
      case QuestionType.MultipleChoice:
        return "多选题";
      case QuestionType.TrueFalse:
        return "判断题";
      case QuestionType.FillInBlank:
        return "填空题";
      case QuestionType.ShortAnswer:
        return "简答题";
      default:
        return "未知题型";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        {/* 题型标签 */}
        <div className="mb-4">
          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {getQuestionTypeText(question.type)}
          </span>
        </div>

        {/* 题目内容 */}
        <QuestionContent
          question={question}
          userAnswer={userAnswer}
          showAnswer={showAnswer}
          isReviewMode={isReviewMode}
          onAnswerSelect={onAnswerSelect}
          onAnswerChange={onAnswerChange}
        />

        {/* 查看答案按钮 */}
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={onShowAnswer}
            disabled={showAnswer}
            className="w-full sm:w-auto"
          >
            <FaLightbulb className="mr-2" />
            {showAnswer ? "已显示答案" : "查看答案"}
          </Button>
        </div>
      </div>
    </div>
  );
}
