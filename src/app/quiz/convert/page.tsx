'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaMagic, FaKey, FaSave, FaEye } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { DeepseekClient } from '@/lib/deepseek';
import { createEmptyBank } from '@/utils/quiz';
import { EXAMPLE_QUESTION_TEXT, DEFAULT_BANK_NAME, QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { Question } from '@/types/quiz';

/**
 * 题目转换页面
 */
export default function ConvertPage() {
  const router = useRouter();
  const { apiKeys, setApiKey, addQuestionBank } = useQuizStore();
  
  const [inputText, setInputText] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<Question[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
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
    
    const newBank = createEmptyBank(bankName, bankDesc);
    newBank.questions = convertedQuestions;
    
    addQuestionBank(newBank);
    setIsSuccess(true);
    
    // 重置状态
    setTimeout(() => {
      setIsSuccess(false);
      setConvertedQuestions([]);
      setInputText('');
      setBankName(DEFAULT_BANK_NAME);
      setBankDesc('');
      router.push(`/quiz/practice?bankId=${newBank.id}`);
    }, 1500);
  };

  /**
   * 加载示例文本
   */
  const handleLoadExample = () => {
    setInputText(EXAMPLE_QUESTION_TEXT);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">题目转换</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 输入区域 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">源文本</h2>
            <button
              onClick={handleLoadExample}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              加载示例
            </button>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
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
              className="flex items-center text-sm text-gray-600"
            >
              <FaKey className="mr-1" />
              {apiKeys.deepseek ? '更改 API 密钥' : '设置 API 密钥'}
            </button>
            
            <button
              onClick={handleConvert}
              disabled={isLoading || !inputText.trim()}
              className={`flex items-center px-4 py-2 rounded-md ${
                isLoading || !inputText.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FaMagic className="mr-2" />
              {isLoading ? '转换中...' : '开始转换'}
            </button>
          </div>
          
          {/* API密钥输入 */}
          {showApiKeyInput && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DeepSeek API 密钥
              </label>
              <div className="flex">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                  placeholder="输入 API 密钥"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput}
                  className={`px-4 py-2 rounded-r-md ${
                    !apiKeyInput
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  保存
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                API 密钥将安全地存储在您的浏览器中，不会发送到任何服务器。
              </p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        {/* 结果区域 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">转换结果</h2>
          
          {convertedQuestions.length > 0 ? (
            <div>
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">
                  已成功转换 {convertedQuestions.length} 道题目
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    单选题: {convertedQuestions.filter(q => q.type === 'single-choice').length} 道
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                    多选题: {convertedQuestions.filter(q => q.type === 'multiple-choice').length} 道
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                    判断题: {convertedQuestions.filter(q => q.type === 'true-false').length} 道
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                    简答题: {convertedQuestions.filter(q => q.type === 'short-answer').length} 道
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      题库名称
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="输入题库名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      题库描述 (可选)
                    </label>
                    <textarea
                      value={bankDesc}
                      onChange={(e) => setBankDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="输入题库描述"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={handleSaveToBank}
                    className="w-full flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <FaSave className="mr-2" />
                    {isSuccess ? '已保存！' : '保存为题库'}
                  </button>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <FaEye className="mr-2" /> 题目预览
                </h3>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {convertedQuestions.map((q, idx) => (
                      <li key={q.id} className="p-3 hover:bg-gray-50">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md mr-2">
                            {QUESTION_TYPE_NAMES[q.type]}
                          </span>
                          <span>#{idx + 1}</span>
                        </div>
                        <p className="text-sm font-medium">{q.content}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            {q.options.map((opt, optIdx) => (
                              <div key={opt.id}>
                                {String.fromCharCode(65 + optIdx)}. {opt.content}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isLoading ? (
                <div>转换中，请稍候...</div>
              ) : (
                <div>
                  <p className="mb-4">转换结果将在这里显示</p>
                  <p className="text-xs">使用 DeepSeek API 将自然语言题目文本转换为结构化题库</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}