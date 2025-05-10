'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaMagic, FaKey, FaSave, FaEye, FaPlay } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { createEmptyBank } from '@/utils/quiz';
import { EXAMPLE_QUESTION_TEXT, DEFAULT_BANK_NAME, QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { Question, QuestionBank, QuestionType, QuestionOption } from '@/types/quiz';
import { MdSave } from 'react-icons/md';
import { IoDocumentText } from 'react-icons/io5';
import { FaKeyboard } from 'react-icons/fa';
import { FiCheckCircle, FiXCircle, FiChevronDown, FiChevronUp, FiSave, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import { BeatLoader } from 'react-spinners';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

/**
 * 题目转换页面
 */
export default function ConvertPage() {
  const router = useRouter();
  const {
    settings,
    questionBanks,
    addQuestionBank,
    addQuestionToBank,
    getQuestionBankById,
  } = useQuizStore();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedQuestions, setConvertedQuestions] = useState<Omit<Question, 'id'>[]>([]);
  
  // 保存模式: 'new' - 创建新题库, 'existing' - 添加到现有题库
  const [saveMode, setSaveMode] = useState<'new' | 'existing'>('new');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  
  const [bankName, setBankName] = useState(DEFAULT_BANK_NAME);
  const [bankDesc, setBankDesc] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [newBankName, setNewBankName] = useState('');
  const [newBankDescription, setNewBankDescription] = useState('');

  // Alibaba API 固定参数
  const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const ALIBABA_MODEL = "qwen-turbo";

  // States for UI control
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  /**
   * 处理题目转换
   */
  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError('请输入题目文本');
      return;
    }

    const { aiProvider, deepseekApiKey, deepseekBaseUrl, alibabaApiKey } = settings;
    
    // 检查当前所选提供商的 API 密钥是否已配置
    if (aiProvider === 'deepseek' && !deepseekApiKey) {
      setError('请先在应用设置中配置 Deepseek API 密钥');
      return;
    } else if (aiProvider === 'alibaba' && !alibabaApiKey) {
      setError('请先在应用设置中配置通义千问 API 密钥');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setConvertedQuestions([]);

    const systemPrompt = '你是一个专业的题库转换助手。请将用户提供的文本精准地转换为结构化的题目数据。题目类型包括单选题、多选题、判断题、简答题。请严格按照以下格式输出，每道题之间用空行分隔：\n单选题：题目内容\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4\n答案：A\n解析：可选的解析内容\n\n多选题：题目内容\nA. 选项1\nB. 选项2\nC. 选项3\nD. 选项4\n答案：A, B\n解析：可选的解析内容\n\n判断题：题目内容\n答案：对 或 错 (或 True/False, 正确/错误)\n解析：可选的解析内容\n\n简答题：题目内容\n答案：参考答案\n解析：可选的解析内容';

    try {
      let assistantResponse;

      if (aiProvider === 'deepseek') {
        // 使用后端代理调用 Deepseek API
        const response = await fetch('/api/ai/deepseek', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: deepseekApiKey,
            baseUrl: deepseekBaseUrl,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: inputText },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API请求失败，状态码: ${response.status}`);
        }
        const data = await response.json();
        assistantResponse = data.choices[0]?.message?.content;
      } 
      else if (aiProvider === 'alibaba') {
        // 使用后端代理调用通义千问 API
        const response = await fetch('/api/ai/alibaba', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: alibabaApiKey,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: inputText },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API请求失败，状态码: ${response.status}`);
        }
        const data = await response.json();
        assistantResponse = data.choices[0]?.message?.content;
      }

      if (assistantResponse) {
        const parsed = parseQuestions(assistantResponse);
        setConvertedQuestions(parsed);
      } else {
        throw new Error('未能从API获取有效回复。');
      }
    } catch (e: any) {
      setError(e.message || '转换过程中发生未知错误。');
    }
    setIsLoading(false);
  };

  /**
   * 将转换后的题目保存为题库
   */
  const handleSaveToBank = () => {
    if (convertedQuestions.length === 0) return;
    
    let targetBankId = selectedBankId;
    if (!targetBankId && newBankName.trim()) {
      const newBank = addQuestionBank(newBankName, newBankDescription);
      targetBankId = newBank.id;
      setSelectedBankId(targetBankId);
      setNewBankName('');
      setNewBankDescription('');
    } else if (!targetBankId) {
      setError('请选择一个题库或输入新题库的名称以保存题目。');
      return;
    }

    convertedQuestions.forEach(q => addQuestionToBank(targetBankId, q));

    // 不再自动跳转，仅显示成功信息
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  // 开始练习该题库
  const handleStartPractice = (bankId: string) => {
    router.push(`/quiz/practice?bankId=${bankId}`);
  };

  // 清除当前转换内容，继续转换
  const handleContinueConverting = () => {
    setConvertedQuestions([]);
    setInputText('');
    setBankName(DEFAULT_BANK_NAME);
    setBankDesc('');
  };

  /**
   * 渲染题目答案
   */
  const renderAnswer = (question: Omit<Question, 'id'>) => {
    const { type, answer, options = [] } = question;
    
    if (type === QuestionType.SingleChoice && typeof answer === 'string') {
      const option = options.find(opt => opt.id === answer);
      return (
        <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
          答案: {answer}. {option?.content}
        </div>
      );
    } 
    else if (type === QuestionType.MultipleChoice && Array.isArray(answer)) {
      return (
        <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
          答案: {answer.join(', ')}
        </div>
      );
    }
    else if (type === QuestionType.TrueFalse && typeof answer === 'string') {
      return (
        <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
          答案: {answer === 'true' ? '正确' : '错误'}
        </div>
      );
    }
    else if (type === QuestionType.ShortAnswer && typeof answer === 'string') {
      return (
        <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
          答案: {answer}
        </div>
      );
    }
    
    return null;
  };

  /**
   * 加载示例文本
   */
  const handleLoadExample = () => {
    setInputText(EXAMPLE_QUESTION_TEXT);
  };

  const countByType = (type: QuestionType) => convertedQuestions.filter(q => q.type === type).length;

  // 显示当前选中的 AI 提供商信息
  const renderProviderInfo = () => {
    const { aiProvider } = settings;
    return (
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center space-x-3">
        <Image 
          width={20} 
          height={20} 
          src={aiProvider === 'deepseek' ? '/logo/Deepseek.jpg' : '/logo/Qwen.jpg'} 
          alt={aiProvider === 'deepseek' ? 'Deepseek Logo' : 'Qwen Logo'} 
          className="mr-2" 
        />
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-300">
            正在使用 {aiProvider === 'deepseek' ? 'Deepseek' : '通义千问 (Alibaba)'} AI
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            可在<a href="/quiz/settings" className="underline hover:text-blue-800 dark:hover:text-blue-200">应用设置</a>中更改 AI 提供商
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          文本/AI 智能转换为题库
        </h1>

        {/* 显示当前 AI 提供商信息 */}
        {renderProviderInfo()}

        {/* Text Input Area */}
        <div className="mb-6">
          <label htmlFor="textToConvert" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            输入需要转换的题目文本:
          </label>
          <textarea
            id="textToConvert"
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            placeholder="在此粘贴题目文本，或尝试使用AI转换。支持单选题、多选题、判断题、简答题的自动识别。"
          />
          <div className="mt-2 flex justify-between items-center">
            <button 
              onClick={handleLoadExample}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
            >
              <IoDocumentText className="mr-1" /> 加载示例
            </button>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              <FaKeyboard className="inline mr-1" /> 支持多种题型
            </div>
          </div>
        </div>

        {/* Convert Button */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={handleConvert}
            disabled={isLoading || !inputText.trim()}
            className={`px-6 py-3 rounded-md flex items-center justify-center font-semibold transition-colors duration-200 text-lg
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white shadow-md hover:shadow-lg'
              }
              ${!inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <BeatLoader size={8} color="#ffffff" />
            ) : (
              <>
                <FaMagic className="mr-2" />
                开始转换
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-start">
            <FiXCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-start">
            <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>题目已成功保存！即将跳转到练习页面...</span>
          </div>
        )}

        {/* Converted Questions Preview */}
        {convertedQuestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">已转换的题目 ({convertedQuestions.length}题)</h2>
            
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.values(QuestionType).filter(type => typeof type === 'number').map(type => (
                <div key={type} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                  {QUESTION_TYPE_NAMES[type as QuestionType]} × {countByType(type as QuestionType)}
                </div>
              ))}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              {(showAllQuestions ? convertedQuestions : convertedQuestions.slice(0, 3)).map((q, idx) => (
                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {QUESTION_TYPE_NAMES[q.type]}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{q.content}</p>
                  {(q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) && q.options && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {q.options.map((opt, i) => (
                        <div key={i} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt.content}
                        </div>
                      ))}
                    </div>
                  )}
                  {renderAnswer(q)}
                </div>
              ))}
              {!showAllQuestions && convertedQuestions.length > 3 && (
                <button 
                  onClick={() => setShowAllQuestions(true)}
                  className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  展开显示全部 {convertedQuestions.length} 道题 <FiChevronDown className="inline" />
                </button>
              )}
              {showAllQuestions && (
                <button 
                  onClick={() => setShowAllQuestions(false)}
                  className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  收起 <FiChevronUp className="inline" />
                </button>
              )}
            </div>

            {/* Save Options */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-750 dark:border-gray-700 dark:border rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">保存题目</h3>
              
              <div className="space-y-4">
                {/* Radio buttons for save mode */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="saveMode"
                      checked={saveMode === 'new'}
                      onChange={() => setSaveMode('new')}
                      className="mr-2"
                    />
                    <span className="text-gray-800 dark:text-gray-200">创建新题库</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="saveMode"
                      checked={saveMode === 'existing'}
                      onChange={() => setSaveMode('existing')}
                      className="mr-2"
                    />
                    <span className="text-gray-800 dark:text-gray-200">添加到现有题库</span>
                  </label>
                </div>
                
                {/* Conditional input based on save mode */}
                {saveMode === 'new' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">题库名称</label>
                      <input 
                        type="text"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="输入新题库名称"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">题库描述 (可选)</label>
                      <input 
                        type="text"
                        value={newBankDescription}
                        onChange={(e) => setNewBankDescription(e.target.value)}
                        placeholder="输入题库描述"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">选择题库</label>
                    <select 
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">请选择题库</option>
                      {questionBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name} ({bank.questions.length}道题)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button 
                  onClick={handleSaveToBank}
                  disabled={saveMode === 'new' ? !newBankName.trim() : !selectedBankId}
                  className={`w-full px-4 py-3 rounded-md text-white font-semibold flex items-center justify-center
                    ${
                      (saveMode === 'new' && !newBankName.trim()) || (saveMode === 'existing' && !selectedBankId)
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                    }
                  `}
                >
                  <MdSave className="mr-2" /> 保存题目
                </button>
              </div>
            </div>

            {/* Success Message with Options */}
            {isSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center">
                  <FiCheckCircle className="mr-2" /> 
                  题目已成功保存！
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button 
                    onClick={handleContinueConverting} 
                    className="flex-1 px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-md font-medium flex items-center justify-center"
                  >
                    <FaMagic className="mr-2" /> 继续转换题目
                  </button>
                  <button 
                    onClick={() => handleStartPractice(selectedBankId)} 
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-md font-medium flex items-center justify-center"
                  >
                    <FaPlay className="mr-2" /> 开始练习题目
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 解析 AI 返回的文本，转换为题目对象数组
 */
const parseQuestions = (text: string): Omit<Question, 'id'>[] => {
  const questions: Omit<Question, 'id'>[] = [];
  // 拆分为每个题目块
  const questionBlocks = text.split(/\n\s*\n+/).filter(block => block.trim());
  
  for (const block of questionBlocks) {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) continue; // 至少需要题目和答案两行
      
      let questionType: QuestionType;
      let content: string;
      let options: QuestionOption[] = [];
      let answer: string | string[] = '';
      let explanation: string = '';
      
      // 检测题目类型
      if (lines[0].includes('单选题：')) {
        questionType = QuestionType.SingleChoice;
        content = lines[0].replace(/^单选题：/, '').trim();
        
        // 解析选项
        const optionLines = lines.filter(line => /^[A-Za-z]\./.test(line));
        options = optionLines.map(line => {
          const match = line.match(/^([A-Za-z])\.(.+)$/);
          if (!match) return { id: uuidv4(), content: line };
          const optionId = match[1].toUpperCase();
          return { id: optionId, content: match[2].trim() };
        });
        
        // 解析答案
        const answerLine = lines.find(line => line.startsWith('答案：'));
        if (answerLine) {
          const answerMatch = answerLine.match(/答案：([A-Za-z])/);
          if (answerMatch) {
            answer = answerMatch[1].toUpperCase();
          }
        }
      } 
      else if (lines[0].includes('多选题：')) {
        questionType = QuestionType.MultipleChoice;
        content = lines[0].replace(/^多选题：/, '').trim();
        
        // 解析选项
        const optionLines = lines.filter(line => /^[A-Za-z]\./.test(line));
        options = optionLines.map(line => {
          const match = line.match(/^([A-Za-z])\.(.+)$/);
          if (!match) return { id: uuidv4(), content: line };
          const optionId = match[1].toUpperCase();
          return { id: optionId, content: match[2].trim() };
        });
        
        // 解析答案
        const answerLine = lines.find(line => line.startsWith('答案：'));
        if (answerLine) {
          const answerText = answerLine.replace(/^答案：/, '').trim();
          answer = answerText.split(/[\s,，、]+/).map(a => a.trim().toUpperCase()).filter(Boolean);
        }
      } 
      else if (lines[0].includes('判断题：')) {
        questionType = QuestionType.TrueFalse;
        content = lines[0].replace(/^判断题：/, '').trim();
        
        // 解析答案
        const answerLine = lines.find(line => line.startsWith('答案：'));
        if (answerLine) {
          const answerText = answerLine.replace(/^答案：/, '').trim();
          if (['对', '正确', 'TRUE', 'True', 'true'].includes(answerText)) {
            answer = 'true';
          } else if (['错', '错误', 'FALSE', 'False', 'false'].includes(answerText)) {
            answer = 'false';
          }
        }
      } 
      else if (lines[0].includes('简答题：')) {
        questionType = QuestionType.ShortAnswer;
        content = lines[0].replace(/^简答题：/, '').trim();
        
        // 解析答案
        const answerIndex = lines.findIndex(line => line.startsWith('答案：'));
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^答案：/, '').trim();
        }
      } 
      else {
        // 尝试自动判断类型
        const hasOptions = lines.some(line => /^[A-Za-z]\./.test(line));
        
        if (hasOptions) {
          // 检查是否为多选
          const answerLine = lines.find(line => line.startsWith('答案：'));
          if (answerLine && answerLine.includes(',')) {
            questionType = QuestionType.MultipleChoice;
          } else {
            questionType = QuestionType.SingleChoice;
          }
        } else {
          // 判断是否为判断题
          const answerLine = lines.find(line => line.startsWith('答案：'));
          if (answerLine) {
            const answerText = answerLine.replace(/^答案：/, '').trim();
            if (['对', '错', '正确', '错误', 'TRUE', 'True', 'true', 'FALSE', 'False', 'false'].includes(answerText)) {
              questionType = QuestionType.TrueFalse;
            } else {
              questionType = QuestionType.ShortAnswer;
            }
          } else {
            // 默认为短答题
            questionType = QuestionType.ShortAnswer;
          }
        }
        
        content = lines[0].trim();
        
        // 根据类型处理选项和答案
        if (questionType === QuestionType.SingleChoice || questionType === QuestionType.MultipleChoice) {
          // 解析选项
          const optionLines = lines.filter(line => /^[A-Za-z]\./.test(line));
          options = optionLines.map(line => {
            const match = line.match(/^([A-Za-z])\.(.+)$/);
            if (!match) return { id: uuidv4(), content: line };
            const optionId = match[1].toUpperCase();
            return { id: optionId, content: match[2].trim() };
          });
          
          // 解析答案
          const answerLine = lines.find(line => line.startsWith('答案：'));
          if (answerLine) {
            const answerText = answerLine.replace(/^答案：/, '').trim();
            if (questionType === QuestionType.SingleChoice) {
              const answerMatch = answerText.match(/([A-Za-z])/);
              if (answerMatch) {
                answer = answerMatch[1].toUpperCase();
              }
            } else {
              answer = answerText.split(/[\s,，、]+/).map(a => a.trim().toUpperCase()).filter(Boolean);
            }
          }
        } else if (questionType === QuestionType.TrueFalse) {
          // 解析答案
          const answerLine = lines.find(line => line.startsWith('答案：'));
          if (answerLine) {
            const answerText = answerLine.replace(/^答案：/, '').trim();
            if (['对', '正确', 'TRUE', 'True', 'true'].includes(answerText)) {
              answer = 'true';
            } else if (['错', '错误', 'FALSE', 'False', 'false'].includes(answerText)) {
              answer = 'false';
            }
          }
        } else { // ShortAnswer
          // 解析答案
          const answerIndex = lines.findIndex(line => line.startsWith('答案：'));
          if (answerIndex >= 0) {
            answer = lines[answerIndex].replace(/^答案：/, '').trim();
          }
        }
      }
      
      // 解析解析
      const explanationIndex = lines.findIndex(line => line.startsWith('解析：'));
      if (explanationIndex >= 0) {
        explanation = lines[explanationIndex].replace(/^解析：/, '').trim();
      }
      
      questions.push({
        content,
        type: questionType,
        options: (questionType === QuestionType.SingleChoice || questionType === QuestionType.MultipleChoice) ? options : [],
        answer,
        explanation,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('解析题目出错:', error);
      // 继续处理下一个题目块
    }
  }
  
  return questions;
};