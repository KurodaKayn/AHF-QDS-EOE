'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaMagic, FaKey, FaSave, FaEye, FaPlay, FaSpinner, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useQuizStore } from '@/hooks/useQuizStore';
import { createEmptyBank } from '@/utils/quiz';
import { EXAMPLE_QUESTION_TEXT, DEFAULT_BANK_NAME, QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { Question, QuestionBank, QuestionType, QuestionOption } from '@/types/quiz';
import { MdSave, MdCode } from 'react-icons/md';
import { IoDocumentText } from 'react-icons/io5';
import { FaKeyboard } from 'react-icons/fa';
import { FiXCircle, FiSave, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import { BeatLoader } from 'react-spinners';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { parseTextByScript, ScriptTemplate } from '@/utils/scriptParser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CONVERT_SYSTEM_PROMPT, callAI } from '@/constants/ai';

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
  // 导入结果状态
  const [importResult, setImportResult] = useState<{total: number; added: number; duplicates: number}>({
    total: 0,
    added: 0,
    duplicates: 0
  });

  const [newBankName, setNewBankName] = useState('');
  const [newBankDescription, setNewBankDescription] = useState('');

  // Alibaba API 固定参数
  const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const ALIBABA_MODEL = "qwen-turbo";

  // States for UI control
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [conversionMode, setConversionMode] = useState<'ai' | 'script'>('ai');
  const [isLoadingScript, setIsLoadingScript] = useState(false); // Separate loading for script

  // 添加脚本模板选择状态
  const [scriptTemplate, setScriptTemplate] = useState<ScriptTemplate>(ScriptTemplate.ChaoXing);

  // New state for example modal
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [exampleModalTitle, setExampleModalTitle] = useState('');
  const [exampleModalContent, setExampleModalContent] = useState('');

  const CHAOXING_EXAMPLE = `1. (单选题)人类历史发展的必然趋势，马克思主义最崇高的社会理想是()。
A. 实现共产主义
B. 共同富裕
C. 和谐
D. 物质极大丰富
我的答案:A:实现共产主义;正确答案:A:实现共产主义;

2. (判断题)游动查询(Scrollable ResultSet)游标默认位置为第一行。
A. 对
B. 错
我的答案:错正确答案:错`;

  const OTHER_EXAMPLE = `1. 问题内容?( )
A. 选项A
B. 选项B
正确答案:B:选项B;

2. 另一个问题
A. Opt1
B. Opt2
C. Opt3
正确答案:C;`;

  /**
   * 显示脚本示例对话框
   */
  const handleShowExample = () => {
    if (scriptTemplate === ScriptTemplate.ChaoXing) {
      setExampleModalTitle('学习通模板示例');
      setExampleModalContent(
`1. (单选题)以下选项中，哪一个是JavaScript的基本数据类型?
A. Array
B. Object
C. Number
D. Function
正确答案:C

2. (多选题)以下哪些是JavaScript框架或库?
A. React
B. Vue
C. Python
D. Angular
正确答案:A,B,D

3. (判断题)HTML是一种编程语言。
正确答案:错误

4. (填空题)CSS选择器中，____ 用于选择类，而 ____ 用于选择ID。
正确答案:(1) .;(2) #`);
    } else if (scriptTemplate === ScriptTemplate.SingleChoice1) {
      setExampleModalTitle('单选题1模板示例');
      setExampleModalContent(
`1. 关于上颌第一磨牙髓腔形态的描述不正确的是A.髓室颊舌中径大于近远中径且大于髓室高度B.髓室顶形凹，最凹处约接近牙冠中1／3 
C.近颊髓角和近舌髓角均接近牙冠中l／3 
D.远颊髓角和远舌髓角均接近牙冠顶l／3 
E.近颊根管为双管型或单双管型者共占63%
参考答案：B

2. 汇合形成面后静脉的是A．面前静脉，颞浅静脉
B．颞浅静脉，领内静脉
C．翼静脉丛，颌内静脉
D．面前静脉，耳后静脉
E．翼静脉丛，耳后静脉
参考答案：B`);
    } else {
      setExampleModalTitle('其它模板示例');
      setExampleModalContent(
`1. 以下哪个不是 JavaScript 基本数据类型?( )
A. String
B. Number
C. Array
D. Boolean
正确答案:C:Array;

2. 哪个 JSP 动作标记用于动态包含另一个 JSP 页面?( )
A. jsp:forward
B. jsp:useBean
C. jsp:setProperty
D. jsp:include
正确答案:D:jsp:include;`);
    }
    setIsExampleModalOpen(true);
  };

  /**
   * 转换文本为结构化题目
   * 根据选择的模式使用AI或脚本解析文本内容
   */
  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError('请输入文本内容！');
      return;
    }
    
    if (inputText.length > 20000) {
      setError('文本内容过长，请分段转换！');
      return;
    }
    
    setError('');
    setConvertedQuestions([]);

    // 根据转换模式处理
    if (conversionMode === 'ai') {
      // AI转换模式
      setIsLoading(true);
      
      const { aiProvider, deepseekApiKey, deepseekBaseUrl, alibabaApiKey } = settings;
      
      if (aiProvider === 'deepseek' && !deepseekApiKey) {
        setError('您尚未配置DeepSeek API密钥，请在设置页面进行配置。');
        setIsLoading(false);
        return;
      }
      
      if (aiProvider === 'alibaba' && !alibabaApiKey) {
        setError('您尚未配置阿里云API密钥，请在设置页面进行配置。');
        setIsLoading(false);
        return;
      }
      
      // 使用CONVERT_SYSTEM_PROMPT作为系统提示词，用于指导AI将文本转换为结构化题目
      const systemPrompt = CONVERT_SYSTEM_PROMPT;

      try {
        let assistantResponse;

        // 使用统一的callAI函数代替API路由调用
        // 该调用使用了src/constants/ai.ts中的callAI函数，传入AI提供商、消息和API密钥等参数
        assistantResponse = await callAI(
          aiProvider, 
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: inputText }
          ],
          aiProvider === 'deepseek' ? deepseekApiKey : alibabaApiKey,
          aiProvider === 'deepseek' ? deepseekBaseUrl : undefined
        );

        if (assistantResponse) {
          // 解析AI返回的文本，转换为题目数据结构
          const parsed = parseQuestions(assistantResponse);
          setConvertedQuestions(parsed);
        } else {
          throw new Error('未能从API获取有效回复。');
        }
      } catch (e: any) {
        setError(e.message || 'AI转换过程中发生未知错误。');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 脚本转换模式
      setIsLoadingScript(true);
      
      try {
        // 使用parseTextByScript函数解析文本
        console.log("开始脚本解析，使用模板:", scriptTemplate);
        const parsedQuestions = parseTextByScript(inputText, scriptTemplate);
        
        if (parsedQuestions.length === 0) {
          throw new Error('未能识别任何题目，请检查文本格式是否符合所选模板要求。');
        }
        
        console.log(`脚本解析完成，识别到 ${parsedQuestions.length} 道题目`);
        setConvertedQuestions(parsedQuestions);
      } catch (e: any) {
        console.error("脚本解析错误:", e);
        setError(e.message || '脚本解析过程中发生未知错误。');
      } finally {
        setIsLoadingScript(false);
      }
    }
  };

  /**
   * 将转换后的题目保存为题库
   */
  const handleSaveToBank = async () => {
    if (convertedQuestions.length === 0) return;
    
    let targetBankId = selectedBankId;
    if (saveMode === 'new' && newBankName.trim()) { // Ensure saveMode is 'new' for creating new bank
      const newBank = await addQuestionBank(newBankName, newBankDescription);
      targetBankId = newBank.id;
      setSelectedBankId(targetBankId); // Optionally select the new bank
      setNewBankName('');
      setNewBankDescription('');
    } else if (saveMode === 'existing' && !selectedBankId) {
      setError('请选择一个题库以添加题目。');
      return;
    } else if (saveMode === 'new' && !newBankName.trim()) {
      setError('请输入新题库的名称。');
      return;
    } else if (!targetBankId) { // Fallback if somehow targetBankId is not set
        setError('未能确定目标题库。');
        return;
    }

    // 记录导入结果
    let addedCount = 0;
    let duplicateCount = 0;
    
    // 逐个添加题目并处理返回结果
    const results = await Promise.all(convertedQuestions.map(q => addQuestionToBank(targetBankId, q)));
    
    results.forEach(result => {
      if (result.isDuplicate) {
        duplicateCount++;
      } else if (result.question) {
        addedCount++;
      }
    });
    
    setIsSuccess(true);
    setImportResult({
      total: convertedQuestions.length,
      added: addedCount,
      duplicates: duplicateCount
    });
    setConvertedQuestions([]); // Clear converted questions after saving
    setInputText(''); // Clear input text
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
    setIsSuccess(false); // Hide success message
    // Reset save options if needed, e.g., back to 'new' and clear bank name
    setSaveMode('new');
    setNewBankName('');
    setNewBankDescription('');
    setSelectedBankId('');
  };

  /**
   * 渲染题目答案
   */
  const renderAnswer = (question: Omit<Question, 'id'>) => {
    const { type, answer, options = [] } = question;
    
    if (type === QuestionType.SingleChoice && typeof answer === 'string' && options.length > 0) {
      const correctOptionIndex = options.findIndex(opt => opt.id === answer);
      if (correctOptionIndex !== -1) {
        const optionLetter = String.fromCharCode(65 + correctOptionIndex);
        const correctOption = options[correctOptionIndex];
        return (
          <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
            答案: {optionLetter}. {correctOption.content}
          </div>
        );
      } else {
        // Fallback if the answer ID doesn't match any option ID
        return (
          <div className="mt-1 text-red-500 dark:text-red-400 font-medium">
            答案: (选项未找到: {answer})
          </div>
        );
      }
    } 
    else if (type === QuestionType.MultipleChoice && Array.isArray(answer) && options.length > 0) {
      const answerDetails = answer
        .map(ansId => {
          const correctOptionIndex = options.findIndex(opt => opt.id === ansId);
          if (correctOptionIndex !== -1) {
            const optionLetter = String.fromCharCode(65 + correctOptionIndex);
            return `${optionLetter}. ${options[correctOptionIndex].content}`;
          }
          return null; // Or some placeholder for invalid ID
        })
        .filter(Boolean);

      if (answerDetails.length > 0) {
        return (
          <div className="mt-1 text-green-600 dark:text-green-400 font-medium">
            答案: {answerDetails.join(', ')}
          </div>
        );
      } else {
        return (
          <div className="mt-1 text-red-500 dark:text-red-400 font-medium">
            答案: (选项未找到)
          </div>
        );
      }
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
  // 该函数显示用户当前选择的AI模型信息和相应的Logo
  const renderProviderInfo = () => {
    const { aiProvider } = settings;
    // 使用相对路径直接加载Logo
    const logoFileName = aiProvider === 'deepseek' ? 'Deepseek.jpg' : 'Qwen.jpg';
    
    return (
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center space-x-3">
        <Image 
          width={20} 
          height={20} 
          src={`/logo/${logoFileName}`} 
          alt={aiProvider === 'deepseek' ? 'Deepseek Logo' : 'Qwen Logo'} 
          className="mr-2"
          onError={(e) => {
            // 如果加载失败，隐藏图片元素
            e.currentTarget.style.display = 'none';
            console.error(`无法加载AI Logo: ${logoFileName}`);
          }}
          unoptimized
        />
        <div>
          <h3 className="font-medium text-blue-800 dark:text-white">
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

        {/* Conversion Mode Selector */}
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"> {/* Changed from dark:bg-gray-800 to dark:bg-gray-750 for a slightly lighter script settings box */}
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">选择转换模式</h2>
          <div className="flex space-x-4">
            {(['ai', 'script'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setConversionMode(mode)}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex-1 
                  ${conversionMode === mode
                    ? (mode === 'ai' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-green-600 text-white dark:bg-green-700')
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}
                `}
              >
                {mode === 'ai' ? '🧠 AI 智能转换' : '📜 脚本格式转换'}
              </button>
            ))}
          </div>
          
          {/* 脚本转换模式的提示和模板选择 */}
          {conversionMode === 'script' && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"> {/* Changed dark:bg-gray-750 to dark:bg-gray-800 for consistency */}
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">脚本设置</h3>
              <div className="flex items-center space-x-3">
                <label htmlFor="scriptTemplateSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  识别模板:
                </label>
                <select
                  id="scriptTemplateSelect"
                  value={scriptTemplate}
                  onChange={(e) => setScriptTemplate(e.target.value as ScriptTemplate)}
                  className="flex-grow mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value={ScriptTemplate.ChaoXing}>学习通</option>
                  <option value={ScriptTemplate.SingleChoice1}>单选题1</option>
                  <option value={ScriptTemplate.Other}>其它</option>
                </select>
                <button
                  onClick={handleShowExample}
                  className="ml-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-blue-300 dark:bg-blue-600 dark:hover:bg-blue-500 flex items-center"
                >
                  <FaEye className="mr-1" /> 查看示例
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Text Area (common for both modes) */}
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

        {/* AI Provider Settings (Conditional Rendering) */}
        {conversionMode === 'ai' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center space-x-3">
            {renderProviderInfo()}
          </div>
        )}

        {/* Convert Button - text might change based on mode or loading state */}
        <button 
          onClick={handleConvert} 
          disabled={isLoading || isLoadingScript || !inputText.trim()}
          className={`w-full px-6 py-3 mt-4 rounded-md text-white font-semibold transition-colors flex items-center justify-center 
            ${(isLoading || isLoadingScript || !inputText.trim()) 
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
              : conversionMode === 'ai' 
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' 
                : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'}
          `}
        >
          {(isLoading && conversionMode === 'ai') || (isLoadingScript && conversionMode === 'script') ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : conversionMode === 'ai' ? (
            <FaMagic className="mr-2" />
          ) : (
            <MdCode className="mr-2" />
          )}
          {conversionMode === 'ai' ? (isLoading ? 'AI转换中...' : '开始 AI 转换') : (isLoadingScript ? '脚本解析中...' : '开始脚本转换')}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-start"> {/* Added mt-6 for spacing */}
            <FiXCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
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
                <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3 last:border-b-0 last:mb-0"> {/* Added mb-3 and last:mb-0 */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span className="mr-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {QUESTION_TYPE_NAMES[q.type]}
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white">{q.content}</p>
                  {(q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) && q.options && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {q.options.map((opt, i) => (
                        <div key={opt.id} className="text-sm text-gray-700 dark:text-gray-300"> {/* Used opt.id for key */}
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
                  className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2" // Added mt-2
                >
                  展开显示全部 {convertedQuestions.length} 道题 <FaChevronDown className="inline ml-1" />
                </button>
              )}
              {showAllQuestions && convertedQuestions.length > 3 && ( // Ensure button only shows if there are more than 3
                <button 
                  onClick={() => setShowAllQuestions(false)}
                  className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2" // Added mt-2
                >
                  收起 <FaChevronUp className="inline ml-1" />
                </button>
              )}
            </div>

            {/* Save Options */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">保存题目</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="saveMode"
                      checked={saveMode === 'new'}
                      onChange={() => setSaveMode('new')}
                      className="mr-2 form-radio text-blue-600 dark:text-blue-500 bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">创建新题库</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="saveMode"
                      checked={saveMode === 'existing'}
                      onChange={() => setSaveMode('existing')}
                      className="mr-2 form-radio text-blue-600 dark:text-blue-500 bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">添加到现有题库</span>
                  </label>
                </div>
                
                {saveMode === 'new' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">题库名称</label>
                      <input 
                        type="text"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="输入新题库名称"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">题库描述 (可选)</label>
                      <input 
                        type="text"
                        value={newBankDescription}
                        onChange={(e) => setNewBankDescription(e.target.value)}
                        placeholder="输入题库描述"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                      <option value="" className="text-gray-500 dark:text-gray-400">请选择题库</option>
                      {questionBanks.map(bank => (
                        <option key={bank.id} value={bank.id} className="dark:bg-gray-700 dark:text-white">
                          {bank.name} ({bank.questions.length}道题)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <button 
                  onClick={handleSaveToBank}
                  disabled={((saveMode === 'new' && !newBankName.trim()) || (saveMode === 'existing' && !selectedBankId)) || convertedQuestions.length === 0}
                  className={`w-full px-4 py-3 rounded-md text-white font-semibold flex items-center justify-center transition-colors
                    ${
                      (((saveMode === 'new' && !newBankName.trim()) || (saveMode === 'existing' && !selectedBankId)) || convertedQuestions.length === 0)
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
                  <FaCheckCircle className="mr-2" /> 
                  题目导入完成！
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  已将 {importResult.added} 道题目成功导入到题库: {getQuestionBankById(selectedBankId)?.name || newBankName}。
                  {importResult.duplicates > 0 && (
                    <span className="block mt-1 text-amber-600 dark:text-amber-400">
                      有 {importResult.duplicates} 道题目因重复而未导入。
                    </span>
                  )}
                </p>
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
                    <FaPlay className="mr-2" /> 开始练习该题库
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Example Modal */}
      {isExampleModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
          <div className="relative mx-auto p-6 border w-full max-w-md md:max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{exampleModalTitle}</h3>
              <button
                onClick={() => setIsExampleModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FiXCircle size={24} />
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <p className="mb-3">请确保您的文本格式与以下示例类似，以便脚本正确解析：</p>
              <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs text-gray-700 dark:text-gray-200 overflow-x-auto max-h-60">
                <code>
                  {exampleModalContent}
                </code>
              </pre>
            </div>
            <div className="mt-6 pt-4 text-right border-t dark:border-gray-700">
              <button
                onClick={() => setIsExampleModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
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
      else if (lines[0].includes('填空题：')) {
        questionType = QuestionType.FillInBlank;
        content = lines[0].replace(/^填空题：/, '').trim();
        
        // 确保题目内容包含填空符号
        if (!content.includes('____') && !content.includes('_____')) {
          content = content.replace(/\(([^)]+)\)/g, '____');  // 把括号中的内容替换为填空符
        }
        
        // 解析答案
        const answerIndex = lines.findIndex(line => line.startsWith('答案：'));
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^答案：/, '').trim();
        }
      }
      else {
        // 尝试自动判断类型
        const hasOptions = lines.some(line => /^[A-Za-z]\./.test(line));
        const hasFillBlank = lines[0].includes('____') || lines[0].includes('_____'); // 检查是否包含填空符号
        
        if (hasFillBlank) {
          questionType = QuestionType.FillInBlank;
        } else if (hasOptions) {
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
        } else if (questionType === QuestionType.FillInBlank) {
          // 解析填空题答案
          const answerLine = lines.find(line => line.startsWith('答案：'));
          if (answerLine) {
            answer = answerLine.replace(/^答案：/, '').trim();
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