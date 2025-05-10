'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle, FaTrash, FaTimes, FaSearch, FaPlayCircle, FaListUl, FaCheck } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { QuestionType } from '@/types/quiz';
import { QUESTION_TYPE_NAMES, getTagColor } from '@/constants/quiz';
import WrongQuestionItem, { WrongQuestionDisplay } from '@/components/quiz/WrongQuestionItem';

/**
 * 错题本页面
 */
export default function ReviewPage() {
  const router = useRouter();
  const { questionBanks, records, clearRecords } = useQuizStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBankId, setFilterBankId] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'options' | 'list'>('options');

  /**
   * 汇总错题信息
   */
  const wrongQuestions = useMemo(() => {
    const wrongRecords = records.filter(record => !record.isCorrect);
    const questions: (WrongQuestionDisplay | null)[] = wrongRecords.map(record => {
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
    });
    return questions.sort((a, b) => (b?.answeredAt || 0) - (a?.answeredAt || 0));
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

  if (wrongQuestions.length === 0 && viewMode === 'options') {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            <FaExclamationTriangle className="inline-block mr-2 text-yellow-600 dark:text-yellow-500" />
            错题本
          </h1>
        </div>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-500 dark:text-gray-400 mb-4">太棒了，您目前没有错题记录！</p>
          <button
            onClick={() => router.push('/quiz')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md"
          >
            返回题库列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          <FaExclamationTriangle className="inline-block mr-2 text-yellow-600 dark:text-yellow-500" />
          错题本
        </h1>
        {viewMode === 'list' && wrongQuestions.length > 0 && (
          <button
            onClick={handleClearRecords}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md"
          >
            <FaTrash className="mr-2" />
            清空错题本
          </button>
        )}
        {viewMode === 'list' && (
            <button
                onClick={() => setViewMode('options')}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-md ml-4"
            >
                返回选项
            </button>
        )}
      </div>

      {viewMode === 'options' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={() => router.push('/quiz/review/practice')}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center justify-center text-center transform hover:scale-105"
          >
            <FaPlayCircle className="text-5xl text-blue-500 dark:text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">开始重做错题</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">进入练习模式，巩固掌握不牢固的知识点。</p>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center justify-center text-center transform hover:scale-105"
          >
            <FaListUl className="text-5xl text-green-500 dark:text-green-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">浏览和查找错题</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">查看所有错题记录，搜索或按题库筛选。</p>
          </button>
        </div>
      ) : (
        <div>
          {/* 筛选工具栏 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="搜索错题内容..."
                />
              </div>
              
              <div>
                <select
                  value={filterBankId}
                  onChange={(e) => setFilterBankId(e.target.value as 'all' | string)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
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
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400">没有符合筛选条件的错题</p>
              </div>
            ) : (
              filteredQuestions.map(q => (
                <WrongQuestionItem key={q ? (q.id + q.answeredAt) : Math.random()} question={q as WrongQuestionDisplay} formatDate={formatDate} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 