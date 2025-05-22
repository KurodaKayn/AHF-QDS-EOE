import React, { useState, useEffect } from 'react';
import { Question, QuestionBank, QuestionType } from '@/types/quiz'; // 假设 QuestionBank 类型已定义
import { FaTimes } from 'react-icons/fa';
// import QuestionItemDisplay from './QuestionItemDisplay'; // 假设有一个通用的题目展示组件

interface SimilarQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalQuestions: Question[]; // 用于参考或显示用户基于哪些题目生成的
  generatedQuestions: Question[];
  isLoading: boolean;
  availableBanks: QuestionBank[]; // 题库列表
  onImport: (selectedQuestions: Question[], targetBankId: string) => Promise<void>;
}

/**
 * AI生成相似题目结果展示与导入操作的模态框。
 */
const SimilarQuestionsModal: React.FC<SimilarQuestionsModalProps> = ({
  isOpen,
  onClose,
  originalQuestions,
  generatedQuestions,
  isLoading,
  availableBanks,
  onImport,
}) => {
  const [selectedQuestionsMap, setSelectedQuestionsMap] = useState<Record<string, boolean>>({});
  const [targetBankId, setTargetBankId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // 当可用题库列表变化时，默认选中第一个（如果存在）
    if (availableBanks && availableBanks.length > 0) {
      setTargetBankId(availableBanks[0].id);
    } else {
      setTargetBankId('');
    }
  }, [availableBanks]);

  useEffect(() => {
    // Modal打开时，清空之前的选择
    if (isOpen) {
      setSelectedQuestionsMap({});
      // 如果可用题库列表不为空，且当前没有选中的目标题库，则默认选中第一个
      if (availableBanks && availableBanks.length > 0 && !targetBankId) {
        setTargetBankId(availableBanks[0].id);
      }
    }
  }, [isOpen, availableBanks, targetBankId]);

  const handleToggleSelectQuestion = (questionId: string) => {
    setSelectedQuestionsMap(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const selectedCount = Object.values(selectedQuestionsMap).filter(Boolean).length;

  const handleImportClick = async () => {
    const questionsToImport = generatedQuestions.filter(q => q.id && selectedQuestionsMap[q.id]);
    if (questionsToImport.length === 0) {
      alert('请至少选择一道题目进行导入。'); // 后续可以替换为更友好的提示组件
      return;
    }
    if (!targetBankId) {
      alert('请选择目标题库。');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(questionsToImport, targetBankId);
      // 可以在这里添加成功提示，然后关闭Modal或清空列表
      onClose(); // 导入成功后关闭 Modal
    } catch (error) {
      console.error('Failed to import questions:', error);
      alert('导入题目失败，请稍后再试。'); // 错误处理
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            AI 生成的相似题目
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="关闭"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">正在努力生成相似题目，请稍候...</p>
          </div>
        )}

        {!isLoading && generatedQuestions.length === 0 && (
          <div className="text-center py-10 flex-grow flex flex-col justify-center items-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">未能生成相似题目。</p>
            {originalQuestions.length > 0 && (
                 <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    基于 {originalQuestions.length} 道原始题目尝试生成。
                 </p>
            )}
             <button 
                onClick={onClose}
                className="mt-6 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                关闭
            </button>
          </div>
        )}

        {!isLoading && generatedQuestions.length > 0 && (
          <>
            <div className="mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                基于 {originalQuestions.length} 道原始题目，为您生成了以下 <span className="font-semibold text-blue-600 dark:text-blue-400">{generatedQuestions.length}</span> 道相似题目：
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                请勾选您想要保留的题目，并选择目标题库进行导入。
                </p>
            </div>
            <div className="overflow-y-auto flex-grow mb-4 pr-2 -mr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-700">
              {generatedQuestions.map((q, index) => (
                <div 
                  key={q.id || `gen-q-${index}`} 
                  className={`p-3 border rounded-md transition-all duration-150 ease-in-out ${selectedQuestionsMap[q.id ?? ''] ? 'border-blue-500 bg-blue-50 dark:bg-gray-700 shadow-md' : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm'}`}
                >
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedQuestionsMap[q.id ?? '']}
                      onChange={() => q.id && handleToggleSelectQuestion(q.id)}
                      disabled={!q.id}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 text-sm">
                       <p className="font-medium text-gray-800 dark:text-white">{index + 1}. {q.content}</p>
                       
                       {/* Options for Single/Multiple Choice */}
                       {(q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) && q.options && q.options.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs pl-4">
                            {q.options.map((opt, optIdx) => {
                                const isCorrectOption = Array.isArray(q.answer)
                                                        ? q.answer.includes(opt.id)
                                                        : q.answer === opt.id;
                                
                                let optionStyle = "block text-gray-600 dark:text-gray-400 py-0.5";
                                if (isCorrectOption) {
                                    optionStyle = "block font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-700 dark:bg-opacity-40 px-2 py-0.5 rounded-sm";
                                }
                                return (
                                    <span key={opt.id || `opt-${optIdx}`} className={optionStyle}>
                                        {String.fromCharCode(65 + optIdx)}. {opt.content}
                                    </span>
                                );
                            })}
                        </div>
                       )}

                       {/* Answer for True/False if no options shown */}
                       {q.type === QuestionType.TrueFalse && (!q.options || q.options.length === 0) && (
                         <div className="mt-2 text-xs pl-4">
                           <p className="font-semibold text-gray-700 dark:text-gray-300">参考答案：
                             <span className="text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-700 dark:bg-opacity-40 px-2 py-0.5 rounded-sm ml-1">
                               {q.answer === 'true' ? '正确' : (q.answer === 'false' ? '错误' : String(q.answer))}
                             </span>
                           </p>
                         </div>
                       )}

                       {/* Answer for Fill-in-the-Blank */}
                       {q.type === QuestionType.FillInBlank && Array.isArray(q.answer) && q.answer.length > 0 && (
                        <div className="mt-2 text-xs pl-4">
                          <p className="font-semibold text-gray-700 dark:text-gray-300">参考答案：
                            {q.answer.map((ans, ansIdx) => (
                              <span key={ansIdx} className="text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-700 dark:bg-opacity-40 px-2 py-0.5 rounded-sm ml-1 mb-0.5 inline-block">
                                {ans}
                              </span>
                            ))}
                          </p>
                        </div>
                       )}

                       {/* Answer for Short Answer */}
                       {q.type === QuestionType.ShortAnswer && typeof q.answer === 'string' && q.answer.trim() !== '' && (
                        <div className="mt-2 text-xs pl-4">
                          <p className="font-semibold text-gray-700 dark:text-gray-300">参考答案：
                            <span className="block whitespace-pre-wrap text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-700 dark:bg-opacity-40 px-2 py-1 rounded-sm mt-1">
                              {q.answer}
                            </span>
                          </p>
                        </div>
                       )}

                       <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2 gap-y-1 items-center">
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">类型: {q.type}</span>
                            {q.tags && q.tags.length > 0 && 
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">考点: {q.tags.join(', ')}</span>
                            }
                       </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label htmlFor="targetBank" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    导入到题库:
                  </label>
                  <select
                    id="targetBank"
                    value={targetBankId}
                    onChange={(e) => setTargetBankId(e.target.value)}
                    disabled={availableBanks.length === 0 || isImporting}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:opacity-50"
                  >
                    {availableBanks.length === 0 && <option value="">暂无可用题库</option>}
                    {availableBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleImportClick}
                  disabled={selectedCount === 0 || !targetBankId || isImporting || isLoading}
                  className="w-full sm:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
                >
                  {isImporting ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在导入...
                    </span>
                  ) : `导入选中的 ${selectedCount} 道题目`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SimilarQuestionsModal; 