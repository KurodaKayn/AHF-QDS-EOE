"use client";

import { IoDocumentText } from "react-icons/io5";
import { FaKeyboard } from "react-icons/fa";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onLoadExample?: () => void;
  placeholder?: string;
}

export function TextInputArea({
  value,
  onChange,
  onLoadExample,
  placeholder = "在此粘贴题目文本，或尝试使用AI转换。支持单选题、多选题、判断题、简答题的自动识别。",
}: TextInputAreaProps) {
  return (
    <div className="mb-6">
      <label
        htmlFor="textToConvert"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        输入需要转换的题目文本:
      </label>
      <textarea
        id="textToConvert"
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        placeholder={placeholder}
      />
      <div className="mt-2 flex justify-between items-center">
        {onLoadExample && (
          <button
            onClick={onLoadExample}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
          >
            <IoDocumentText className="mr-1" /> 加载示例
          </button>
        )}
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          <FaKeyboard className="inline mr-1" /> 支持多种题型
        </div>
      </div>
    </div>
  );
}
