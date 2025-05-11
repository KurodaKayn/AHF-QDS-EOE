'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quizStore';

export default function ReviewPracticePage() {
  const router = useRouter();
  const { questionBanks, records } = useQuizStore();

  useEffect(() => {
    // 获取错题记录
    const wrongRecords = records.filter(r => !r.isCorrect);
    
    if (wrongRecords.length === 0) {
      // 如果没有错题，跳转回错题本页面
      router.push('/quiz/review');
      return;
    }
    
    // 找出第一个有错题的题库
    const bankWithWrongQuestions = questionBanks.find(bank => 
      bank.questions.some(q => 
        wrongRecords.some(record => record.questionId === q.id)
      )
    );
    
    if (bankWithWrongQuestions) {
      // 跳转到普通练习页面，但添加参数表示这是错题练习模式
      router.push(`/quiz/practice?bankId=${bankWithWrongQuestions.id}&mode=review`);
    } else {
      // 如果错题记录存在但找不到对应题库中的题目（例如题目或题库被删除）
      // alert('未能找到包含错题的题库，或相关题目已被移除。');
      router.push('/quiz/review'); // 安全返回到错题本
    }
  }, [router, questionBanks, records]);

  return (
    <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 mt-4">正在准备错题练习...</p>
    </div>
  );
} 