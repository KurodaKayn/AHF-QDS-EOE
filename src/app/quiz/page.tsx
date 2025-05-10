'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaPlay, FaBook, FaArrowRight, FaExclamationTriangle, FaShareAlt } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { QuestionBank } from '@/types/quiz';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function QuizPage() {
  const router = useRouter();
  const { questionBanks, addQuestionBank, deleteQuestionBank, updateQuestionBank } = useQuizStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [bankName, setBankName] = useState('');
  const [bankDescription, setBankDescription] = useState('');

  // 用于强制刷新列表，以便 date-fns 的时间正确更新
  const [_, setForceUpdate] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

  const handleOpenModal = (bank: QuestionBank | null = null) => {
    setEditingBank(bank);
    setBankName(bank ? bank.name : '');
    setBankDescription(bank ? bank.description || '' : '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBank(null);
    setBankName('');
    setBankDescription('');
  };

  const handleSubmitModal = () => {
    if (!bankName.trim()) {
      alert('题库名称不能为空！');
      return;
    }
    if (editingBank) {
      updateQuestionBank(editingBank.id, bankName, bankDescription);
    } else {
      addQuestionBank(bankName, bankDescription);
    }
    handleCloseModal();
  };

  const handleDeleteBank = (bankId: string) => {
    if (confirm('确定要删除这个题库吗？所有相关题目和练习记录也将被删除。')) {
      deleteQuestionBank(bankId); // Corrected: pass bankId string
    }
  };

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
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleOpenModal(bank)} 
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="编辑题库信息"
                    >
                        <FaEdit size={18} />
                    </button>
                    <button 
                        onClick={() => handleDeleteBank(bank.id)} // Corrected: pass bank.id
                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
                        title="删除题库"
                    >
                        <FaTrash size={18} />
                    </button>
                </div>
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
            onClick={() => router.push(`/quiz/edit/${bank.id}`)}
            className="flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <FaBook className="mr-2"/> 管理题目
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900 p-4 md:p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400 dark:from-blue-400 dark:to-sky-300 py-2">
          我的题库
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">创建、管理并开始您的学习之旅。</p>
      </header>

      {questionBanks.length === 0 ? (
        <div className="text-center py-12">
          <FaExclamationTriangle className="mx-auto text-5xl text-yellow-500 dark:text-yellow-400 mb-6" />
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">您还没有创建任何题库。</p>
          <button 
            onClick={() => handleOpenModal()} 
            className="px-6 py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
          >
            <FaPlus className="mr-2" /> 创建第一个题库
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {questionBanks.map(quizListItem)}
          {/* "Add New Bank" Card - Removed block and flex conflict */}
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 
                       border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 
                       flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 min-h-[200px] md:min-h-[250px]"
          >
            <FaPlus size={40} className="mb-3"/>
            <span className="text-lg font-medium">创建新题库</span>
          </button>
        </div>
      )}
      
    

      {/* Modal for Add/Edit Bank */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              {editingBank ? '编辑题库' : '创建新题库'}
            </h3>
            <div className="space-y-5">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  题库名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="例如：计算机网络期末复习"
                />
              </div>
              <div>
                <label htmlFor="bankDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  题库描述 (可选)
                </label>
                <textarea
                  id="bankDescription"
                  value={bankDescription}
                  onChange={(e) => setBankDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  placeholder="例如：包含选择题、判断题和简答题，共50道。"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-4">
              <button 
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                取消
              </button>
              <button 
                onClick={handleSubmitModal}
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {editingBank ? '保存更改' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}