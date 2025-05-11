'use client';

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface NumQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (numQuestions: number) => void;
  totalQuestions: number;
  bankName?: string;
}

const NumQuestionsModal: React.FC<NumQuestionsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  totalQuestions,
  bankName,
}) => {
  const [numQuestions, setNumQuestions] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Reset input when modal opens or totalQuestions changes
    if (isOpen) {
      // Default to a smaller number or total questions if total is small
      const defaultNum = totalQuestions > 0 ? Math.min(10, totalQuestions).toString() : '1';
      setNumQuestions(defaultNum);
      setError('');
    }
  }, [isOpen, totalQuestions]);

  const handleSubmit = () => {
    const num = parseInt(numQuestions, 10);
    if (isNaN(num) || num <= 0) {
      setError('请输入一个大于0的有效数字。');
      return;
    }
    if (num > totalQuestions) {
      setError(`题目数量不能超过题库总数 (${totalQuestions}题)。`);
      return;
    }
    setError('');
    onSubmit(num);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            选择刷题数量
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="关闭弹窗"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {bankName && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            题库: {bankName}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          请输入您本次要刷的题目数量。
        </p>

        <div className="mb-4">
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            题目数量
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              id="numQuestions"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              min="1"
              max={totalQuestions}
            />
            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
              / {totalQuestions} 题
            </span>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={totalQuestions === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
          >
            开始刷题
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumQuestionsModal; 