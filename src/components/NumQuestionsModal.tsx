/**
 * 选择刷题数量的模态对话框组件
 * 
 * 该组件允许用户选择本次练习需要的题目数量，具有以下功能：
 * 1. 显示当前题库信息（名称和总题目数）
 * 2. 提供数字输入界面，限制用户输入范围
 * 3. 执行数据验证（不能为空、不能超过题库总数、必须为正数）
 * 4. 自动设置默认值（默认为10题或题库总数，取较小值）
 * 
 * 组件状态：
 * - numQuestions: 用户选择的题目数量（字符串格式便于表单处理）
 * - error: 表单验证错误信息
 * 
 * 组件接收的Props:
 * - isOpen: 控制模态框显示/隐藏的布尔值
 * - onClose: 关闭模态框的回调函数
 * - onSubmit: 提交所选数量的回调函数，接收数字参数
 * - totalQuestions: 题库中题目的总数，用于验证和显示
 * - bankName: 可选，当前题库的名称，用于界面显示
 */
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

  /**
   * 模态框打开或题库变化时初始化数量输入
   * 
   * 当isOpen状态变为true或totalQuestions变化时：
   * 1. 计算默认题目数量（最多10题，或全部题目如果总数小于10）
   * 2. 设置数量输入框的初始值
   * 3. 清除任何之前的验证错误
   * 
   * 这种设计确保用户每次打开模态框时都能看到合理的默认值，
   * 并且当切换到不同题库时能自动调整数量建议
   */
  useEffect(() => {
    // 当模态框打开或总题目数量变化时重置输入
    if (isOpen) {
      // 默认选择较小的数量或总题目数（如果总数较小）
      const defaultNum = totalQuestions > 0 ? Math.min(10, totalQuestions).toString() : '1';
      setNumQuestions(defaultNum);
      setError('');
    }
  }, [isOpen, totalQuestions]);

  /**
   * 处理表单提交
   * 
   * 工作流程：
   * 1. 将输入值转换为整数并验证
   * 2. 检查数字是否有效（非NaN且大于0）
   * 3. 验证是否超过题库总题目数
   * 4. 如验证失败，设置相应错误信息
   * 5. 如验证通过，清除错误并调用onSubmit回调
   * 
   * 提交成功后，父组件将通过onSubmit回调获取所选数量并开始刷题
   */
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