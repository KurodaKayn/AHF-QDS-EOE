'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaMagic, FaKey, FaSave, FaEye } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { DeepseekClient } from '@/lib/deepseek';
import { createEmptyBank } from '@/utils/quiz';
import { EXAMPLE_QUESTION_TEXT, DEFAULT_BANK_NAME, QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { Question } from '@/types/quiz';
import { MdSave } from 'react-icons/md';
import { IoDocumentText } from 'react-icons/io5';
import { FaKeyboard } from 'react-icons/fa';

/**
 * 题目转换页面
 */
export default function ConvertPage() {
  const router = useRouter();
  const { apiKeys, setApiKey, addQuestionBank, questionBanks, addQuestionsToBank } = useQuizStore();
  
  const [inputText, setInputText] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<Question[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // 保存模式: 'new' - 创建新题库, 'existing' - 添加到现有题库
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  
  const [bankName, setBankName] = useState(DEFAULT_BANK_NAME);
  const [bankDesc, setBankDesc] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // 初始化API密钥
  useEffect(() => {
    if (apiKeys.deepseek) {
      setApiKeyInput(apiKeys.deepseek);
    } else {
      setShowApiKeyInput(true);
    }
  }, [apiKeys.deepseek]);

  /**
   * 处理API密钥保存
   */
  const handleSaveApiKey = () => {
    setApiKey({ deepseek: apiKeyInput });
    setShowApiKeyInput(false);
  };

  /**
   * 处理题目转换
   */
  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError('请输入题目文本');
      return;
    }
    
    if (!apiKeys.deepseek && !apiKeyInput) {
      setError('请先设置 DeepSeek API 密钥');
      setShowApiKeyInput(true);
      return;
    }
    
    const apiKey = apiKeyInput || apiKeys.deepseek;
    const client = new DeepseekClient(apiKey);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const questions = await client.parseText(inputText);
      setConvertedQuestions(questions);
      setError(null);
    } catch (err: any) {
      setError(err.message || '转换失败，请检查API密钥和网络连接');
      setConvertedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 将转换后的题目保存为题库
   */
  const handleSaveToBank = () => {
    if (!convertedQuestions.length) return;
    
    if (saveMode === 'new') {
      const newBank = createEmptyBank(bankName, bankDesc);
      newBank.questions = convertedQuestions;
      addQuestionBank(newBank);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setConvertedQuestions([]);
        setInputText('');
        setBankName(DEFAULT_BANK_NAME);
        setBankDesc('');
        setSelectedBankId(null); // 重置选中的题库ID
        setSaveMode('new'); // 重置保存模式
        router.push(`/quiz/practice?bankId=${newBank.id}`);
      }, 1500);
    } else if (saveMode === 'existing' && selectedBankId) {
      // 调用新的 action 将问题添加到现有题库
      addQuestionsToBank(selectedBankId, convertedQuestions);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setConvertedQuestions([]);
        setInputText('');
        // 不需要重置 bankName 和 bankDesc，因为它们不是用于保存的
        // selectedBankId 和 saveMode 会在下次选择时改变
        router.push(`/quiz/practice?bankId=${selectedBankId}`);
      }, 1500);
    }
  };

  /**
   * 加载示例文本
   */
  const handleLoadExample = () => {
    setInputText(EXAMPLE_QUESTION_TEXT);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">题目转换</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 输入区域 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold dark:text-white">源文本</h2>
            <button
              onClick={handleLoadExample}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
            >
              加载示例
            </button>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 dark:bg-gray-700 dark:text-white"
            rows={12}
            placeholder="粘贴题目文本，例如：
1. 以下哪个不是 JavaScript 基本数据类型?( )
A. String
B. Number
C. Array
D. Boolean
正确答案:C:Array;"
          />
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400"
            >
              <FaKey className="mr-1" />
              {apiKeys.deepseek ? '更改 API 密钥' : '设置 API 密钥'}
            </button>
            
            <button
              onClick={handleConvert}
              disabled={isLoading || !inputText.trim()}
              className={`flex items-center px-4 py-2 rounded-md ${
                isLoading || !inputText.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FaMagic className="mr-2" />
              {isLoading ? '转换中...' : '开始转换'}
            </button>
          </div>
          
          {/* API密钥输入 */}
          {showApiKeyInput && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DeepSeek API 密钥
              </label>
              <div className="flex">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md dark:bg-gray-800 dark:text-white"
                  placeholder="输入 API 密钥"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput}
                  className={`px-4 py-2 rounded-r-md ${
                    !apiKeyInput
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  保存
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                API 密钥将安全地存储在您的浏览器中，不会发送到任何服务器。
              </p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        {/* 结果区域 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold dark:text-white mb-4">转换结果</h2>
          
          {convertedQuestions.length > 0 ? (
            <div>
              <div className="mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  已成功转换 {convertedQuestions.length} 道题目
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-md text-sm">
                    单选题: {convertedQuestions.filter(q => q.type === 'single-choice').length} 道
                  </span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-md text-sm">
                    多选题: {convertedQuestions.filter(q => q.type === 'multiple-choice').length} 道
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded-md text-sm">
                    判断题: {convertedQuestions.filter(q => q.type === 'true-false').length} 道
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-md text-sm">
                    简答题: {convertedQuestions.filter(q => q.type === 'short-answer').length} 道
                  </span>
                </div>
                
                {/* 保存选项 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    保存到
                  </label>
                  <select
                    value={saveMode === 'new' ? 'new' : selectedBankId || 'new'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'new') {
                        setSaveMode('new');
                        setSelectedBankId(null);
                        setBankName(DEFAULT_BANK_NAME); // 重置为默认新题库名称
                        setBankDesc('');
                      } else {
                        setSaveMode('existing');
                        setSelectedBankId(value);
                        const selected = questionBanks.find(qb => qb.id === value);
                        if (selected) {
                          setBankName(selected.name); // 可选：用选中题库名称填充
                          setBankDesc(selected.description || '');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="new">创建新题库</option>
                    {questionBanks.map(qb => (
                      <option key={qb.id} value={qb.id}>{qb.name}</option>
                    ))}
                  </select>
                </div>

                {/* 题库名称和描述输入 (仅当创建新题库时) */}
                {saveMode === 'new' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        题库名称
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="输入题库名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        题库描述 (可选)
                      </label>
                      <textarea
                        value={bankDesc}
                        onChange={(e) => setBankDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        rows={2}
                        placeholder="输入题库描述"
                      />
                    </div>
                  </div>
                )}
                {saveMode === 'existing' && selectedBankId && (
                   <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md">
                     将添加到现有题库: {questionBanks.find(qb => qb.id === selectedBankId)?.name || '未知题库'}
                   </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={handleSaveToBank}
                    className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:ring-offset-gray-800"
                  >
                    <FaSave className="mr-2" />
                    {isSuccess ? '已保存！' : '保存为题库'}
                  </button>
                </div>
              </div>
              
              {/* 问题预览区域 */}
              {convertedQuestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">问题预览</h3>
                  <div className="space-y-4">
                    {convertedQuestions.slice(0, 3).map((q, i) => (
                      <div key={i} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <p className="font-medium mb-2 dark:text-white">{q.content}</p>
                        {q.type === 'single-choice' || q.type === 'multiple-choice' ? (
                          <div className="space-y-2">
                            {q.options?.map((option, j) => (
                              <div key={j} className="flex items-center">
                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white mr-2">
                                  {String.fromCharCode(65 + j)}
                                </span>
                                <span className="dark:text-gray-300">{typeof option === 'string' ? option : option.content}</span>
                              </div>
                            ))}
                          </div>
                        ) : q.type === 'true-false' ? (
                          <div className="space-y-2 dark:text-gray-300">
                            <div>选项：对/错</div>
                          </div>
                        ) : (
                          <div className="italic text-gray-600 dark:text-gray-400">简答题</div>
                        )}
                      </div>
                    ))}
                    {convertedQuestions.length > 3 && (
                      <p className="text-gray-600 dark:text-gray-400 italic">...还有 {convertedQuestions.length - 3} 道问题未显示</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isLoading ? (
                <div className="dark:text-white">转换中，请稍候...</div>
              ) : (
                <div>
                  <p className="mb-4 dark:text-gray-300">转换结果将在这里显示</p>
                  <p className="text-xs dark:text-gray-400">使用 DeepSeek API 将自然语言题目文本转换为结构化题库</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}