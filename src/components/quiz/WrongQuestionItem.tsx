'use client';

import { FaCheck, FaTimes } from 'react-icons/fa';
import { Question, QuestionType, QuestionOption } from '@/types/quiz';
import { QUESTION_TYPE_NAMES, getTagColor } from '@/constants/quiz';

// 定义错题项的扩展类型
export interface WrongQuestionDisplay extends Question {
  bankId: string;
  bankName: string;
  userAnswer: string | string[];
  answeredAt: number;
}

interface WrongQuestionItemProps {
  question: WrongQuestionDisplay | null; // 使用更精确的类型
  formatDate: (timestamp: number) => string;
  // 未来可能添加的 props: onRemove?: (questionId: string) => void; onPractice?: (questionId: string) => void;
}

export default function WrongQuestionItem({ question: q, formatDate }: WrongQuestionItemProps) {
  if (!q) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-2">
          <span className={`px-2 py-1 text-xs rounded-md ${getTagColor(QUESTION_TYPE_NAMES[q.type])}`}>
            {QUESTION_TYPE_NAMES[q.type]}
          </span>
          <span className={`px-2 py-1 text-xs rounded-md ${getTagColor(q.bankName || '未知题库')}`}>
            {q.bankName || '未知题库'}
          </span>
          {q.tags && q.tags.length > 0 && (
            q.tags.map((tag: string) => (
              <span
                key={tag}
                className={`px-1.5 py-0.5 text-xs rounded-full ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))
          )}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          答错时间: {formatDate(q.answeredAt)}
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
        {q.content}
      </h3>
      
      {/* 展示选项 (如果有) */}
      {q.options && q.options.length > 0 && (q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) && (
        <div className="space-y-1 mb-3 text-sm">
          {q.options.map((option: QuestionOption, idx: number) => {
            const optionId = option.id; 
            const isCorrectOption = Array.isArray(q.answer) 
              ? q.answer.includes(optionId) 
              : q.answer === optionId;
              
            const isUserSelected = Array.isArray(q.userAnswer) 
              ? q.userAnswer.includes(optionId) 
              : q.userAnswer === optionId;
            
            let optionStyle = 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
            if (isCorrectOption) {
              optionStyle = 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200';
            }
            if (isUserSelected && !isCorrectOption) {
              optionStyle = 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200';
            }
            if (isUserSelected && isCorrectOption) {
              optionStyle = 'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 font-semibold';
            }

            return (
              <div
                key={option.id}
                className={`p-2 rounded-md flex items-center ${optionStyle}`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                <span>{option.content}</span>
                {isUserSelected && !isCorrectOption && (
                  <FaTimes className="inline ml-auto text-red-500 dark:text-red-400" />
                )}
                {isCorrectOption && !isUserSelected && (
                  <span className="ml-auto text-xs text-green-600 dark:text-green-400">(正确答案)</span>
                )}
                 {isCorrectOption && isUserSelected && (
                  <FaCheck className="inline ml-auto text-green-600 dark:text-green-400" />
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* 判断题答案和用户答案 */}
      {q.type === QuestionType.TrueFalse && (
        <div className="text-sm mb-3">
          <p className={`${q.userAnswer === q.answer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            您的答案: {q.userAnswer === 'true' ? '正确' : '错误'}
          </p>
          <p className="text-green-600 dark:text-green-400">
            正确答案: {q.answer === 'true' ? '正确' : '错误'}
          </p>
        </div>
      )}

      {/* 简答题答案和用户答案 */}
      {q.type === QuestionType.ShortAnswer && (
          <div className="text-sm mb-3">
              <div className="p-2 rounded-md bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 mb-1">
                  <span className="font-medium">您的答案: </span>{Array.isArray(q.userAnswer) ? q.userAnswer.join(', ') : q.userAnswer || '未作答'}
              </div>
              <div className="p-2 rounded-md bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
                  <span className="font-medium">正确答案: </span>{typeof q.answer === 'string' ? q.answer : Array.isArray(q.answer) ? q.answer.join(', ') : ''}
              </div>
          </div>
      )}
      
      {/* 解析 */}
      {q.explanation && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">解析:</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {q.explanation}
          </p>
        </div>
      )}
    </div>
  );
} 