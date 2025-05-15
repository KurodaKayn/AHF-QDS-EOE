'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaExclamationTriangle, FaTrash, FaTimes, FaSearch, FaPlayCircle, FaListUl, FaCheck, FaMagic, FaRobot } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { QuestionType } from '@/types/quiz';
import { QUESTION_TYPE_NAMES, getTagColor } from '@/constants/quiz';
import WrongQuestionItem, { WrongQuestionDisplay } from '@/components/quiz/WrongQuestionItem';
import { EXPLANATION_PROMPT, callAI } from '@/constants/ai';

/**
 * 错题本页面
 */
export default function ReviewPage() {
  const router = useRouter();
  const { questionBanks, records, clearRecords, updateQuestionInBank, settings } = useQuizStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBankId, setFilterBankId] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'options' | 'list'>('options');
  // 新增状态：选中的题目和正在生成解析的题目
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [generatingExplanations, setGeneratingExplanations] = useState<Set<string>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);
  // 新增状态：当前正在更新的解析内容
  const [currentExplanations, setCurrentExplanations] = useState<Record<string, string>>({});
  // 缓存已成功生成的解析，避免内容消失
  const [completedExplanations, setCompletedExplanations] = useState<Record<string, string>>({});

  /**
   * 处理开始练习错题
   */
  const handleStartPractice = () => {
    // 获取错题记录
    const wrongRecords = records.filter(record => !record.isCorrect);
    
    if (wrongRecords.length === 0) {
      alert('没有错题可供练习！');
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
      alert('找不到包含错题的题库，请先进行一些练习！');
    }
  };

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

  /**
   * 处理选择/取消选择题目
   */
  const handleSelectQuestion = (question: WrongQuestionDisplay) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(question.id)) {
        newSet.delete(question.id);
      } else {
        newSet.add(question.id);
      }
      return newSet;
    });
  };

  /**
   * 全选/取消全选
   */
  const handleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      // 如果已全选，则取消全选
      setSelectedQuestions(new Set());
    } else {
      // 全选所有筛选后的题目
      const newSelected = new Set<string>();
      filteredQuestions.forEach(q => {
        if (q) newSelected.add(q.id);
      });
      setSelectedQuestions(newSelected);
    }
  };

  /**
   * 使用 AI 生成解析
   */
  const generateExplanations = async () => {
    // 检查是否有选中题目
    if (selectedQuestions.size === 0) {
      alert('请先选择需要生成解析的题目！');
      return;
    }

    // 检查 AI 配置
    const { aiProvider, deepseekApiKey, deepseekBaseUrl, alibabaApiKey } = settings;
    if (aiProvider === 'deepseek' && !deepseekApiKey) {
      setAiError('请先在应用设置中配置 Deepseek API 密钥');
      return;
    } else if (aiProvider === 'alibaba' && !alibabaApiKey) {
      setAiError('请先在应用设置中配置通义千问 API 密钥');
      return;
    }

    setAiError(null);

    // 为每个选中的题目生成解析
    const processQuestion = async (questionId: string) => {
      // 跳过已经生成的
      if (generatingExplanations.has(questionId)) return;

      // 找到题目和所属题库
      const questionInfo = wrongQuestions.find(q => q && q.id === questionId);
      if (!questionInfo) return;

      // 设置生成中状态
      setGeneratingExplanations(prev => new Set([...prev, questionId]));
      // 初始化该题目的解析为空
      setCurrentExplanations(prev => ({...prev, [questionId]: ''}));

      try {
        // 构建题目信息
        let problemInfo = `### 题目信息\n\n`;
        problemInfo += `- **题目类型**: ${QUESTION_TYPE_NAMES[questionInfo.type]}\n`;
        
        // 添加选项（如果有）
        if (questionInfo.options && questionInfo.options.length > 0) {
          problemInfo += '- **选项**:\n';
          questionInfo.options.forEach((opt, idx) => {
            problemInfo += `  - ${String.fromCharCode(65 + idx)}. ${opt.content}\n`;
          });
        }

        // 添加正确答案
        problemInfo += `- **正确答案**: ${
          Array.isArray(questionInfo.answer) 
            ? questionInfo.answer.map(ans => {
                const option = questionInfo.options?.find(opt => opt.id === ans);
                return option ? option.content : ans;
              }).join(', ')
            : questionInfo.type === QuestionType.TrueFalse
              ? questionInfo.answer === 'true' ? '正确' : '错误'
              : questionInfo.answer
        }\n`;

        // 添加用户答案
        problemInfo += `- **用户答案**: ${
          Array.isArray(questionInfo.userAnswer)
            ? questionInfo.userAnswer.map(ans => {
                const option = questionInfo.options?.find(opt => opt.id === ans);
                return option ? option.content : ans;
              }).join(', ')
            : questionInfo.type === QuestionType.TrueFalse
              ? questionInfo.userAnswer === 'true' ? '正确' : '错误'
              : questionInfo.userAnswer
        }\n`;

        // 构建消息
        const messages = [
          { role: 'system', content: EXPLANATION_PROMPT },
          { role: 'user', content: `${problemInfo}\n\n${questionInfo.content}` }
        ];

        // 使用流式API
        const apiKey = aiProvider === 'deepseek' ? deepseekApiKey : alibabaApiKey;
        const completeResponse = await callAI(
          aiProvider,
          messages,
          apiKey,
          aiProvider === 'deepseek' ? deepseekBaseUrl : undefined,
          true,  // 使用流式传输
          (chunk) => {
            // 处理流式返回的数据块
            setCurrentExplanations(prev => {
              const currentExplanation = prev[questionId] || '';
              return {
                ...prev,
                [questionId]: currentExplanation + chunk
              };
            });
          }
        );

        // 存储完整的解析结果到完成缓存中
        setCompletedExplanations(prev => ({
          ...prev,
          [questionId]: completeResponse || ''
        }));

        // 更新题目解析 - 使用流式累积的完整结果
        await updateQuestionInBank(questionInfo.bankId, questionId, {
          explanation: completeResponse || '',
        });
      } catch (error: any) {
        console.error(`生成解析失败 (${questionId}):`, error);
        setAiError(`生成解析失败: ${error.message}`);
      } finally {
        // 无论成功或失败，从生成中状态移除
        setGeneratingExplanations(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
        // 从选中列表中移除
        setSelectedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
        // 从当前解析列表中移除，但不要立即移除，等待一段时间确保更新完成
        setTimeout(() => {
          setCurrentExplanations(prev => {
            const newExplanations = {...prev};
            delete newExplanations[questionId];
            return newExplanations;
          });
        }, 500);
      }
    };

    // 开始处理每个选中的题目
    for (const questionId of selectedQuestions) {
      await processQuestion(questionId);
    }
  };

  // 当filteredQuestions变化时，清除已完成的解析缓存中不再存在的题目
  useEffect(() => {
    setCompletedExplanations(prev => {
      const newCompletedExplanations = {...prev};
      
      // 删除不再存在于filteredQuestions中的题目
      Object.keys(newCompletedExplanations).forEach(questionId => {
        const stillExists = filteredQuestions.some(q => q && q.id === questionId);
        if (!stillExists) {
          delete newCompletedExplanations[questionId];
        }
      });
      
      return newCompletedExplanations;
    });
  }, [filteredQuestions]);

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
        <div className="flex space-x-2">
          {viewMode === 'list' && selectedQuestions.size > 0 && (
            <button
              onClick={generateExplanations}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-md"
            >
              <FaRobot className="mr-2" />
              AI 解析 ({selectedQuestions.size})
            </button>
          )}
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
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-md"
            >
              返回选项
            </button>
          )}
        </div>
      </div>

      {viewMode === 'options' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={handleStartPractice}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* 全选/取消全选按钮 */}
              <div className="flex items-center">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md ml-2"
                >
                  {selectedQuestions.size === filteredQuestions.length ? (
                    <>
                      <FaTimes className="mr-2" />
                      取消全选
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      全选
                    </>
                  )}
                </button>
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-300">
                  已选择 {selectedQuestions.size} 道题
                </span>
              </div>
            </div>
            
            {/* AI错误信息显示 */}
            {aiError && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
                <p className="text-sm">{aiError}</p>
              </div>
            )}
          </div>
          
          {/* 错题列表 */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400">没有符合筛选条件的错题</p>
              </div>
            ) : (
              filteredQuestions.map(q => {
                if (!q) return null;
                
                // 创建一个显示用的题目副本
                const displayQuestion = {...q};
                
                // 显示优先级：1. 正在生成的解析 2. 已完成的解析缓存 3. 题目原本的解析
                if (generatingExplanations.has(q.id) && currentExplanations[q.id]) {
                  displayQuestion.explanation = currentExplanations[q.id];
                } else if (completedExplanations[q.id]) {
                  // 使用已完成缓存中的解析
                  displayQuestion.explanation = completedExplanations[q.id];
                }
                
                return (
                  <WrongQuestionItem 
                    key={q.id + q.answeredAt} 
                    question={displayQuestion} 
                    formatDate={formatDate}
                    isSelected={selectedQuestions.has(q.id)}
                    onSelect={handleSelectQuestion}
                    isGeneratingExplanation={generatingExplanations.has(q.id)}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
} 