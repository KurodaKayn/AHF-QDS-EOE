'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle, FaTrash, FaTimes, FaSearch } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { QuestionType } from '@/types/quiz';
import { QUESTION_TYPE_NAMES, getTagColor } from '@/constants/quiz';

/**
 * 错题本页面
 */
export default function ReviewPage() {
  const router = useRouter();
  const { questionBanks, records, clearRecords } = useQuizStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBankId, setFilterBankId] = useState<string | 'all'>('all');

  /**
   * 汇总错题信息
   */
  const wrongQuestions = useMemo(() => {
    // 获取所有错题记录
    const wrongRecords = records.filter(record => !record.isCorrect);
    
    // 从所有题库中查找对应的题目
    const questions = wrongRecords.map(record => {
      // 在所有题库中查找此题目
      for (const bank of questionBanks) {
        const question = bank.questions.find(q => q.id === record.questionId);
        if (question) {
          return {
            ...question,
            bankId: bank.id,
            bankName: bank.name,
            userAnswer: record.userAnswer,
            answeredAt: record.answeredAt,
          };
        }
      }
      return null;
    }).filter(q => q !== null); // 过滤掉找不到的题目
    
    // 按照答题时间倒序排列
    return questions.sort((a, b) => b!.answeredAt - a!.answeredAt);
  }, [questionBanks, records]);

  /**
   * 搜索与过滤
   */
  const filteredQuestions = useMemo(() => {
    return wrongQuestions.filter(q => {
      // 根据题库过滤
      if (filterBankId !== 'all' && q?.bankId !== filterBankId) {
        return false;
      }
      
      // 根据搜索词过滤
      if (searchTerm && q) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          q.content.toLowerCase().includes(lowerSearchTerm) ||
          (q.options?.some(opt => opt.content.toLowerCase().includes(lowerSearchTerm)) ?? false) ||
          (q.explanation?.toLowerCase().includes(lowerSearchTerm) ?? false)
        );
      }
      
      return true;
    });
  }, [wrongQuestions, filterBankId, searchTerm]);

  /**
   * 清空错题本
   */
  const handleClearRecords = () => {
    if (confirm('确定要清空错题本吗？此操作不可恢复。')) {
      clearRecords();
    }
  };

  /**
   * 练习选中题目
   */
  const handlePracticeQuestion = (bankId: string) => {
    router.push(`/quiz/practice?bankId=${bankId}`);
  };

  /**
   * 格式化时间
   */
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          <FaExclamationTriangle className="inline-block mr-2 text-yellow-600" />
          错题本
        </h1>
        {wrongQuestions.length > 0 && (
          <button
            onClick={handleClearRecords}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <FaTrash className="mr-2" />
            清空错题本
          </button>
        )}
      </div>

      {wrongQuestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 mb-4">太棒了，您目前没有错题记录！</p>
          <button
            onClick={() => router.push('/quiz')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回题库列表
          </button>
        </div>
      ) : (
        <div>
          {/* 筛选工具栏 */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="搜索错题内容..."
                />
              </div>
              
              <div>
                <select
                  value={filterBankId}
                  onChange={(e) => setFilterBankId(e.target.value as 'all' | string)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">所有题库</option>
                  {questionBanks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* 错题列表 */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">没有符合筛选条件的错题</p>
              </div>
            ) : (
              filteredQuestions.map(q => (
                <div
                  key={q?.id}
                  className="bg-white p-5 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md mr-2">
                        {QUESTION_TYPE_NAMES[q!.type]}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                        {q?.bankName}
                      </span>
                      {q?.tags && q.tags.length > 0 && (
                        <div className="flex gap-1 ml-2">
                          {q.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-1 rounded-md ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(q!.answeredAt)}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    {q?.content}
                  </h3>
                  
                  {/* 展示选项 (如果有) */}
                  {q?.options && q.options.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {q.options.map((option, idx) => {
                        const optionLabel = String.fromCharCode(65 + idx); // A, B, C...
                        
                        // 判断是否为正确答案
                        const isCorrect = q.type === QuestionType.SingleChoice
                          ? q.answer === optionLabel
                          : Array.isArray(q.answer) && q.answer.includes(optionLabel);
                          
                        // 判断用户是否选择了此答案
                        const isSelected = q.type === QuestionType.SingleChoice
                          ? q.userAnswer === optionLabel
                          : Array.isArray(q.userAnswer) && q.userAnswer.includes(optionLabel);
                        
                        return (
                          <div
                            key={option.id}
                            className={`p-2 rounded-md ${
                              isCorrect
                                ? 'bg-green-50'
                                : isSelected
                                  ? 'bg-red-50'
                                  : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-medium mr-1">
                              {optionLabel}.
                            </span>
                            {option.content}
                            
                            {isSelected && !isCorrect && (
                              <FaTimes className="inline ml-2 text-red-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 判断题答案 */}
                  {q?.type === QuestionType.TrueFalse && (
                    <div className="mb-3">
                      <div>
                        <span className="font-medium">您的答案: </span>
                        <span className="text-red-600">
                          {q.userAnswer === 'true' ? '正确' : '错误'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">正确答案: </span>
                        <span className="text-green-600">
                          {q.answer === 'true' ? '正确' : '错误'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* 简答题答案 */}
                  {q?.type === QuestionType.ShortAnswer && (
                    <div className="mb-3">
                      <div>
                        <div className="font-medium mb-1">您的答案:</div>
                        <div className="p-2 bg-red-50 rounded-md">
                          {q.userAnswer as string || '(未作答)'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="font-medium mb-1">正确答案:</div>
                        <div className="p-2 bg-green-50 rounded-md">
                          {q.answer as string}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 解析 */}
                  {q?.explanation && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <div className="font-medium text-blue-800 mb-1">解析:</div>
                      <div className="text-blue-700">{q.explanation}</div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handlePracticeQuestion(q!.bankId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      练习此题库
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 