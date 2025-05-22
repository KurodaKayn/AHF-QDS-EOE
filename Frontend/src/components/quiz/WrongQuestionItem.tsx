'use client';

import { FaCheck, FaTimes } from 'react-icons/fa';
import { Question, QuestionType, QuestionOption } from '@/types/quiz';
import { QUESTION_TYPE_NAMES, getTagColor } from '@/constants/quiz';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';

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
  // 新增props
  isSelected?: boolean;
  onSelect?: (question: WrongQuestionDisplay) => void;
  isGeneratingExplanation?: boolean;
}

/**
 * 移除 Markdown 字符串开头和结尾的完整代码块标记。
 * 例如，将 '```markdown\nHello\n```' 转换为 'Hello'。
 * 确保始终返回一个字符串。
 */
function stripMarkdownCodeFences(markdown: string): string {
  if (typeof markdown !== 'string') {
    return '';
  }
  let newMarkdown = markdown.trim();
  const fenceRegex = /^```(?:[a-zA-Z0-9_\-+.]*\r?\n)?([\s\S]*?)\r?\n```$/;
  const match = newMarkdown.match(fenceRegex);
  if (match && typeof match[1] === 'string') {
    newMarkdown = match[1].trim(); 
  } else {
    newMarkdown = markdown.trim(); 
  }
  return newMarkdown;
}

/**
 * 为流式输出准备Markdown内容。
 * 如果内容以未闭合的```开头，则尝试移除该开头的标记部分。
 * 如果内容是一个已闭合的短代码块，则剥离它。
 */
function stripOpeningFenceForStream(markdown: string): string {
  if (typeof markdown !== 'string') {
    return '';
  }
  let newMarkdown = markdown.trimStart(); // 保留行尾空格，因为可能还在构建中

  const fullFenceRegex = /^```(?:[a-zA-Z0-9_\-+.]*\r?\n)?([\s\S]*?)\r?\n```$/;
  const fullMatch = newMarkdown.match(fullFenceRegex);
  if (fullMatch && typeof fullMatch[1] === 'string') {
    return fullMatch[1].trim(); 
  }

  const openingFenceStartRegex = /^```(?:[a-zA-Z0-9_\-+.]*)?(\r?\n)?/;
  const openingMatch = newMarkdown.match(openingFenceStartRegex);

  if (openingMatch) {
    let contentAfterOpeningFence = newMarkdown.substring(openingMatch[0].length);
    if (contentAfterOpeningFence.trim() === '' && !openingMatch[1]) {
      return ""; // AI仅发送了 ```lang 这样的起始标记，后面还没内容或换行
    }
    return contentAfterOpeningFence.trimStart();
  }

  return newMarkdown; // 如果不以```开头，或者不是完整代码块，直接返回处理过的字符串
}

export default function WrongQuestionItem({ 
  question: q, 
  formatDate, 
  isSelected = false, 
  onSelect, 
  isGeneratingExplanation = false 
}: WrongQuestionItemProps) {
  if (!q) return null;
  
  const rawExplanation = q.explanation || '';
  let markdownToDisplay;

  if (isGeneratingExplanation) {
    markdownToDisplay = stripOpeningFenceForStream(rawExplanation);
  } else {
    markdownToDisplay = stripMarkdownCodeFences(rawExplanation);
  }

  const customComponents: Components = {
    a: (props) => (
      <a 
        {...props} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      />
    ),
    // code: (props) => { // 仍然注释掉，以确保不是自定义代码组件引起的问题
    //   const isInline = !props.className || !props.className.includes('language-');
    //   const codeClass = isInline 
    //     ? 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm' 
    //     : 'block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto';
    //   return <code {...props} className={`${codeClass} ${props.className || ''}`} />;
    // },
    // table: (props) => ( // Temporarily commented out for debugging table rendering
    //   <div className="overflow-x-auto">
    //     <table className="min-w-full border border-gray-300 dark:border-gray-700" {...props} />
    //   </div>
    // ),
    // th: (props) => ( // Temporarily commented out for debugging table rendering
    //   <th className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left font-semibold border border-gray-300 dark:border-gray-700" {...props} />
    // ),
    // td: (props) => ( // Temporarily commented out for debugging table rendering
    //   <td className="px-3 py-2 border border-gray-300 dark:border-gray-700" {...props} />
    // )
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-md ${isSelected ? 'border-2 border-blue-500' : ''} ${isGeneratingExplanation ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 flex-wrap gap-2">
          {onSelect && (
            <div 
              className="flex items-center mr-2 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                if (q) onSelect(q);
              }}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                {isSelected && <FaCheck className="text-white text-xs" />}
              </div>
            </div>
          )}
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
      
      {markdownToDisplay && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">解析:</p>
          <div className="text-sm text-gray-600 dark:text-gray-400 prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown 
              key={`markdown-${q.id}-${markdownToDisplay.length}-${isGeneratingExplanation}`}
              remarkPlugins={[remarkGfm]} 
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={customComponents} 
            >
              {markdownToDisplay}
            </ReactMarkdown>
          </div>
        </div>
      )}
      
      {isGeneratingExplanation && !markdownToDisplay && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <p className="text-sm text-blue-600 dark:text-blue-400">正在生成AI解析...</p>
          </div>
        </div>
      )}
    </div>
  );
} 