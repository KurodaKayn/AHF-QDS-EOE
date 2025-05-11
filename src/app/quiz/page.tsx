'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaPlay, FaBook, FaPlus } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { QuestionBank } from '@/types/quiz';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function QuizPage() {
  const router = useRouter();
  const { questionBanks } = useQuizStore();

  // 用于强制刷新列表，以便 date-fns 的时间正确更新
  const [_, setForceUpdate] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

  const quizListItem = (bank: QuestionBank) => (
    <div 
        key={bank.id} 
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate pr-2" title={bank.name}>
                    {bank.name}
                </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 line-clamp-2" title={bank.description}>{bank.description || '暂无描述'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                {bank.questions.length} 道题目  · 更新于 {formatDistanceToNow(bank.updatedAt, { addSuffix: true, locale: zhCN })}
            </p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push(`/quiz/practice?bankId=${bank.id}`)}
            disabled={bank.questions.length === 0}
            className={`flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors
                        ${bank.questions.length === 0 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'}`}
          >
            <FaPlay className="mr-2"/> 开始练习
          </button>
          <button
            onClick={() => {
              // 使用表单导航来代替router.push
              const form = document.createElement('form');
              form.method = 'GET';
              form.action = '/quiz/banks/manage/index.html';
              form.style.display = 'none';
              document.body.appendChild(form);
              form.submit();
            }}
            className="flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <FaBook className="mr-2"/> 管理题库
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">我的题库</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">选择一个题库开始您的学习之旅，或前往"题库管理"页面创建和编辑题库。</p>
      </header>

      {questionBanks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">
            您还没有任何题库。
          </p>
          <Button 
            onClick={() => {
              const form = document.createElement('form');
              form.method = 'GET';
              form.action = '/quiz/banks/manage/index.html';
              form.style.display = 'none';
              document.body.appendChild(form);
              form.submit();
            }} 
            className="bg-green-600 hover:bg-green-700"
          >
            <FaPlus className="mr-2" /> 前往创建新题库
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {questionBanks.map(quizListItem)}
        </div>
      )}
    </div>
  );
}