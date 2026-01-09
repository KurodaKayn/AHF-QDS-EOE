"use client";

import { FaPlus, FaChevronLeft } from "react-icons/fa";
import { QuestionBank } from "@/types/quiz";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface BankDetailHeaderProps {
  bank: QuestionBank;
  onBack: () => void;
  onAddQuestion: () => void;
}

export function BankDetailHeader({
  bank,
  onBack,
  onAddQuestion,
}: BankDetailHeaderProps) {
  return (
    <header className="mb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
          <div>
            <button
              onClick={onBack}
              className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <FaChevronLeft className="mr-1" /> 返回题库列表
            </button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {bank.name}
            </h1>
            {bank.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {bank.description}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              共 {bank.questions.length} 道题目 · 更新于{" "}
              {formatDistanceToNow(new Date(bank.updatedAt), {
                addSuffix: true,
                locale: zhCN,
              })}
            </p>
          </div>

          <button
            onClick={onAddQuestion}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
          >
            <FaPlus className="mr-2" /> 添加新题目
          </button>
        </div>
      </div>
    </header>
  );
}
