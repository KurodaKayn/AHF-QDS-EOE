'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaPlus, FaEllipsisH, FaPencilAlt, FaTrash } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { createEmptyBank } from '@/utils/quiz';
import { DEFAULT_BANK_NAME } from '@/constants/quiz';

/**
 * 刷题系统主页 - 题库管理
 */
export default function QuizHomePage() {
  const { questionBanks, addQuestionBank, removeQuestionBank } = useQuizStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newBankName, setNewBankName] = useState(DEFAULT_BANK_NAME);
  const [newBankDesc, setNewBankDesc] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);

  /**
   * 创建新题库
   */
  const handleCreateBank = () => {
    if (!newBankName.trim()) return;
    
    const newBank = createEmptyBank(newBankName, newBankDesc || undefined);
    addQuestionBank(newBank);
    
    // 重置表单
    setNewBankName(DEFAULT_BANK_NAME);
    setNewBankDesc('');
    setIsCreating(false);
  };

  /**
   * 删除题库
   */
  const handleDeleteBank = (id: string) => {
    if (confirm('确定要删除这个题库吗？此操作不可恢复。')) {
      removeQuestionBank(id);
    }
    setShowActions(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">题库管理</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          <span>新建题库</span>
        </button>
      </div>

      {/* 新建题库表单 */}
      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">新建题库</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                题库名称
              </label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="输入题库名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                题库描述 (可选)
              </label>
              <textarea
                value={newBankDesc}
                onChange={(e) => setNewBankDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="输入题库描述"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateBank}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 题库列表 */}
      {questionBanks.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">您还没有创建任何题库</p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            创建第一个题库
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionBanks.map((bank) => (
            <div
              key={bank.id}
              className="bg-white p-6 rounded-lg shadow-md relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{bank.name}</h3>
                  {bank.description && (
                    <p className="text-gray-500 mt-1 line-clamp-2">
                      {bank.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    {bank.questions.length} 道题目
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowActions(showActions === bank.id ? null : bank.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaEllipsisH />
                  </button>
                  
                  {/* 操作菜单 */}
                  {showActions === bank.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <Link
                        href={`/quiz/practice?bankId=${bank.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setShowActions(null)}
                      >
                        <FaPencilAlt className="mr-2" />
                        开始练习
                      </Link>
                      <button
                        onClick={() => handleDeleteBank(bank.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <FaTrash className="mr-2" />
                        删除题库
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/quiz/practice?bankId=${bank.id}`}
                  className="flex-1 text-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  开始练习
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}