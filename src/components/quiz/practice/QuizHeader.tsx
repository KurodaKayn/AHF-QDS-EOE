"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FaArrowLeft, FaCog } from "react-icons/fa";
import { QuestionBank } from "@/types/quiz";

interface QuizHeaderProps {
  currentBank: QuestionBank | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestionType: string;
  isReviewMode: boolean;
  onBack: () => void;
  onManageBank: () => void;
}

export function QuizHeader({
  currentBank,
  currentQuestionIndex,
  totalQuestions,
  currentQuestionType,
  isReviewMode,
  onBack,
  onManageBank,
}: QuizHeaderProps) {
  const progressPercentage =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  return (
    <div className="pb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="text-sm"
          >
            <FaArrowLeft className="mr-2" />
            返回
          </Button>
          {currentBank && !isReviewMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageBank}
              className="text-sm"
            >
              <FaCog className="mr-2" />
              管理题库
            </Button>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isReviewMode ? "错题回顾模式" : "当前题库"}
          </p>
          <h2
            className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-50 sm:max-w-xs md:max-w-sm"
            title={currentBank?.name}
          >
            {currentBank?.name
              ? isReviewMode
                ? `${currentBank.name} (错题)`
                : currentBank.name
              : isReviewMode
              ? "错题回顾"
              : "常规练习"}
          </h2>
        </div>
      </div>
      <Progress value={progressPercentage} className="w-full h-2" />
      <div className="flex justify-between items-baseline mt-2">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
          {isReviewMode ? "回顾: " : ""} 第 {currentQuestionIndex + 1} /{" "}
          {totalQuestions} 题
        </h3>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {currentQuestionType}
        </span>
      </div>
    </div>
  );
}
