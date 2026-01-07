"use client";

import { FiXCircle } from "react-icons/fi";

interface ExampleModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export function ExampleModal({
  isOpen,
  title,
  content,
  onClose,
}: ExampleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
      <div className="relative mx-auto p-6 border w-full max-w-md md:max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FiXCircle size={24} />
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          <p className="mb-3">
            请确保您的文本格式与以下示例类似，以便脚本正确解析：
          </p>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs text-gray-700 dark:text-gray-200 overflow-x-auto max-h-60">
            <code>{content}</code>
          </pre>
        </div>
        <div className="mt-6 pt-4 text-right border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
