"use client";

import { FaCheckCircle, FaMagic, FaPlay } from "react-icons/fa";

interface ConversionSuccessProps {
  questionCount: number;
  bankName: string;
  onContinue: () => void;
  onStartPractice: () => void;
}

export function ConversionSuccess({
  questionCount,
  bankName,
  onContinue,
  onStartPractice,
}: ConversionSuccessProps) {
  return (
    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
      <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center">
        <FaCheckCircle className="mr-2" />
        题目已成功保存！
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        已将 {questionCount} 道题目保存到题库: {bankName}。
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={onContinue}
          className="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-md font-medium flex items-center justify-center"
        >
          <FaMagic className="mr-2" /> 继续转换题目
        </button>
        <button
          onClick={onStartPractice}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-md font-medium flex items-center justify-center"
        >
          <FaPlay className="mr-2" /> 开始练习该题库
        </button>
      </div>
    </div>
  );
}
