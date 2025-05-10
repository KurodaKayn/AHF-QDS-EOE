'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes, FaTag } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionType } from '@/types/quiz';
import { getTagColor, QUESTION_TYPE_NAMES } from '@/constants/quiz';

/**
 * 刷题练习页面
 */
export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bankId = searchParams.get('bankId');
  
  const { questionBanks, addRecord } = useQuizStore();
  const [currentBank, setCurrentBank] = useState<typeof questionBanks[0] | undefined>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | string[])[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // 根据 URL 参数加载题库
  useEffect(() => {
    if (!bankId) {
      router.push('/quiz');
      return;
    }
    
    const bank = questionBanks.find(b => b.id === bankId);
    if (!bank) {
      router.push('/quiz');
      return;
    }
    
    setCurrentBank(bank);
    
    // 提取所有可用标签
    const tags = new Set<string>();
    bank.questions.forEach(q => {
      if (q.tags) {
        q.tags.forEach(tag => tags.add(tag));
      }
    });
    setAvailableTags(Array.from(tags));
    
    // 初始化用户答案和显示状态
    const initialQuestions = filterQuestionsByTags(bank.questions, []);
    setQuestions(initialQuestions);
    setUserAnswers(new Array(initialQuestions.length).fill(''));
    setRevealed(new Array(initialQuestions.length).fill(false));
  }, [bankId, questionBanks, router]);

  /**
   * 根据标签过滤题目
   */
  const filterQuestionsByTags = (allQuestions: Question[], tags: string[]): Question[] => {
    if (!tags.length) return allQuestions;
    
    return allQuestions.filter(q => {
      if (!q.tags || !q.tags.length) return false;
      return tags.some(tag => q.tags?.includes(tag));
    });
  };

  /**
   * 处理标签选择变化
   */
  const handleTagsChange = (tags: string[]) => {
    if (!currentBank) return;
    
    setSelectedTags(tags);
    const filteredQuestions = filterQuestionsByTags(currentBank.questions, tags);
    setQuestions(filteredQuestions);
    setUserAnswers(new Array(filteredQuestions.length).fill(''));
    setRevealed(new Array(filteredQuestions.length).fill(false));
    setCurrentIndex(0);
  };

  /**
   * 处理答案变更
   */
  const handleAnswerChange = (answer: string | string[]) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answer;
    setUserAnswers(newAnswers);
  };

  /**
   * 处理答案显示/隐藏
   */
  const toggleReveal = () => {
    const newRevealed = [...revealed];
    newRevealed[currentIndex] = !newRevealed[currentIndex];
    setRevealed(newRevealed);
    
    if (!revealed[currentIndex] && questions[currentIndex]) {
      // 当显示答案时记录答题状态
      const question = questions[currentIndex];
      const userAnswer = userAnswers[currentIndex];
      const isCorrect = checkAnswer(question, userAnswer);
      
      addRecord({
        questionId: question.id,
        userAnswer,
        isCorrect,
        answeredAt: Date.now()
      });
    }
  };

  /**
   * 检查答案正确性
   */
  const checkAnswer = (question: Question, userAnswer: string | string[]): boolean => {
    if (!userAnswer) return false;
    
    if (question.type === QuestionType.MultipleChoice) {
      const correctAnswers = Array.isArray(question.answer) ? question.answer : [];
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
      
      if (correctAnswers.length !== userAnswerArray.length) return false;
      return correctAnswers.every(a => userAnswerArray.includes(a));
    } else {
      return userAnswer === question.answer;
    }
  };

  /**
   * 移动到下一题
   */
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  /**
   * 移动到上一题
   */
  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 当前题目
  const currentQuestion = questions[currentIndex];
  
  // 如果没有题目，显示空状态
  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="text-center py-12 dark:bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          {!currentBank ? '题库加载中...' : '没有找到符合条件的题目'}
        </h1>
        {currentBank && (
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 mb-2">该题库共有 {currentBank.questions.length} 道题目</p>
            
            {availableTags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">选择标签筛选题目:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagsChange(
                        selectedTags.includes(tag)
                          ? selectedTags.filter(t => t !== tag)
                          : [...selectedTags, tag]
                      )}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTags.includes(tag)
                          ? getTagColor(tag)
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => router.push('/quiz')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md"
            >
              返回题库列表
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 dark:text-white min-h-screen p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {currentBank?.name} - 练习模式
        </h1>
        <div className="text-gray-600 dark:text-gray-400">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>
      
      {/* 筛选标签 */}
      {availableTags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <FaTag className="mr-1" /> 按标签筛选:
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagsChange(
                  selectedTags.includes(tag)
                    ? selectedTags.filter(t => t !== tag)
                    : [...selectedTags, tag]
                )}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedTags.includes(tag)
                    ? getTagColor(tag)
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => handleTagsChange([])}
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 题目内容 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span className={`px-2 py-1 ${getTagColor(QUESTION_TYPE_NAMES[currentQuestion.type] || currentQuestion.type)} rounded-md mr-2`}>
            {QUESTION_TYPE_NAMES[currentQuestion.type] || currentQuestion.type}
          </span>
          <span>ID: {currentQuestion.id.substring(0, 8)}</span>
          {currentQuestion.tags && currentQuestion.tags.length > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <FaTag className="text-gray-400 dark:text-gray-500" />
              {currentQuestion.tags.map(tag => (
                <span key={tag} className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(tag)}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {currentQuestion.content}
        </div>

        {/* 答案选项区域 */}
        <div className="space-y-3 mb-4">
          {currentQuestion.type === QuestionType.SingleChoice && currentQuestion.options?.map((option, index) => (
            <button
              key={option.id}
              onClick={() => handleAnswerChange(option.id)} 
              disabled={revealed[currentIndex]} // 答案揭晓后禁用按钮
              className={`w-full text-left p-3 rounded-md border transition-colors
                ${revealed[currentIndex]
                  ? (checkAnswer(currentQuestion, option.id) // 检查此选项是否为正确答案
                      ? (userAnswers[currentIndex] === option.id ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200') // 用户选了此正确选项 vs 未选此正确选项
                      : (userAnswers[currentIndex] === option.id ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300')) // 用户选了此错误选项 vs 未选此错误选项
                  : (userAnswers[currentIndex] === option.id 
                      ? 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600' 
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300')
                }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {option.content}
            </button>
          ))}
          
          {currentQuestion.type === QuestionType.MultipleChoice && currentQuestion.options?.map((option, index) => {
            const userAnswerArray = Array.isArray(userAnswers[currentIndex]) ? userAnswers[currentIndex] as string[] : [];
            const isSelected = userAnswerArray.includes(option.id);
            const isCorrectOption = Array.isArray(currentQuestion.answer) && currentQuestion.answer.includes(option.id);

            return (
              <button
                key={option.id}
                onClick={() => {
                  const currentAnswers = Array.isArray(userAnswers[currentIndex]) ? [...userAnswers[currentIndex] as string[]] : [];
                  if (isSelected) {
                    handleAnswerChange(currentAnswers.filter(ans => ans !== option.id));
                  } else {
                    handleAnswerChange([...currentAnswers, option.id]);
                  }
                }}
                disabled={revealed[currentIndex]} // 答案揭晓后禁用按钮
                className={`w-full text-left p-3 rounded-md border transition-colors
                  ${revealed[currentIndex]
                    ? (isCorrectOption
                        ? (isSelected ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200')
                        : (isSelected ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'))
                    : (isSelected 
                        ? 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300')
                  }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                {option.content}
              </button>
            );
          })}
          
          {currentQuestion.type === QuestionType.TrueFalse && ["true", "false"].map((val, index) => (
            <button
              key={val}
              onClick={() => handleAnswerChange(val)}
              disabled={revealed[currentIndex]} // 答案揭晓后禁用按钮
              className={`w-full text-left p-3 rounded-md border transition-colors
                ${revealed[currentIndex]
                  ? (currentQuestion.answer === val
                      ? (userAnswers[currentIndex] === val ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200')
                      : (userAnswers[currentIndex] === val ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'))
                  : (userAnswers[currentIndex] === val 
                      ? 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600' 
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300')
                }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {val === "true" ? '正确' : '错误'}
            </button>
          ))}

          {currentQuestion.type === QuestionType.ShortAnswer && (
            <textarea
              value={userAnswers[currentIndex] as string || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={3}
              disabled={revealed[currentIndex]} // 答案揭晓后禁用
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
              placeholder="在此输入您的答案..."
            />
          )}
        </div>

        {/* 显示答案/解析区域 */}
        {revealed[currentIndex] && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">答案与解析</h3>
            <div className={`p-3 rounded-md mb-2 text-sm 
              ${checkAnswer(currentQuestion, userAnswers[currentIndex]) 
                ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300'}`}
            >
              <p><span className="font-medium">您的答案:</span> {
                currentQuestion.type === QuestionType.MultipleChoice 
                ? (Array.isArray(userAnswers[currentIndex]) && (userAnswers[currentIndex] as string[]).length > 0 ? (userAnswers[currentIndex] as string[]).map(ans => currentQuestion.options?.find(opt => opt.id === ans)?.content || ans).join(', ') : '未作答') 
                : currentQuestion.type === QuestionType.TrueFalse 
                    ? (userAnswers[currentIndex] === 'true' ? '正确' : (userAnswers[currentIndex] === 'false' ? '错误' : '未作答'))
                    : userAnswers[currentIndex] || '未作答'
              }</p>
              <p><span className="font-medium">正确答案:</span> {
                currentQuestion.type === QuestionType.MultipleChoice 
                ? (Array.isArray(currentQuestion.answer) ? currentQuestion.answer.map(ans => currentQuestion.options?.find(opt => opt.id === ans)?.content || ans).join(', ') : '-') 
                : currentQuestion.type === QuestionType.TrueFalse
                    ? (currentQuestion.answer === 'true' ? '正确' : '错误')
                    : currentQuestion.answer}
              </p>
            </div>
            {currentQuestion.explanation && (
              <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300 text-sm">
                <p className="font-semibold mb-1">解析:</p>
                <p className="whitespace-pre-wrap">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-md flex items-center transition-colors
            ${currentIndex === 0
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          <FaArrowLeft className="mr-1" /> 上一题
        </button>
        
        <button
          onClick={toggleReveal}
          className={`px-4 py-2 rounded-md font-medium transition-colors
            ${revealed[currentIndex]
              ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white'
          }`}
        >
          {revealed[currentIndex] ? '继续答题 / 查看下一题' : '显示答案'}
        </button>
        
        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className={`px-4 py-2 rounded-md flex items-center transition-colors
            ${currentIndex === questions.length - 1
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          下一题 <FaArrowRight className="ml-1" />
        </button>
      </div>
    </div>
  );
} 