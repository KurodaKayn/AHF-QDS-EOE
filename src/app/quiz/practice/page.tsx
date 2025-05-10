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
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {!currentBank ? '题库加载中...' : '没有找到符合条件的题目'}
        </h1>
        {currentBank && (
          <div className="mb-4">
            <p className="text-gray-600 mb-2">该题库共有 {currentBank.questions.length} 道题目</p>
            
            {availableTags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">选择标签筛选题目:</h3>
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
                          : 'bg-gray-100 text-gray-600'
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
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              返回题库列表
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {currentBank?.name} - 练习模式
        </h1>
        <div className="text-gray-600">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>
      
      {/* 筛选标签 */}
      {availableTags.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
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
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => handleTagsChange([])}
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-600"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 题目内容 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md mr-2">
            {QUESTION_TYPE_NAMES[currentQuestion.type]}
          </span>
          {currentQuestion.tags && currentQuestion.tags.length > 0 && (
            <div className="flex gap-1">
              {currentQuestion.tags.map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-1 rounded-md ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <h2 className="text-xl font-medium text-gray-800 mb-4">
          {currentIndex + 1}. {currentQuestion.content}
        </h2>
        
        {/* 选择题选项 */}
        {(currentQuestion.type === QuestionType.SingleChoice || 
          currentQuestion.type === QuestionType.MultipleChoice) && 
          currentQuestion.options && (
          <div className="space-y-2 mb-4">
            {currentQuestion.options.map((option, idx) => {
              const optionLabel = String.fromCharCode(65 + idx); // A, B, C...
              const isSelected = currentQuestion.type === QuestionType.SingleChoice
                ? userAnswers[currentIndex] === optionLabel
                : Array.isArray(userAnswers[currentIndex]) && 
                  userAnswers[currentIndex].includes(optionLabel);
              
              const isCorrect = revealed[currentIndex] && (
                (currentQuestion.type === QuestionType.SingleChoice && 
                 currentQuestion.answer === optionLabel) ||
                (currentQuestion.type === QuestionType.MultipleChoice && 
                 Array.isArray(currentQuestion.answer) && 
                 currentQuestion.answer.includes(optionLabel))
              );
              
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-3 rounded-md border ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200'
                  } ${
                    revealed[currentIndex]
                      ? isCorrect
                        ? 'bg-green-50 border-green-300'
                        : isSelected
                          ? 'bg-red-50 border-red-300'
                          : ''
                      : 'hover:bg-gray-50'
                  } transition-colors cursor-pointer`}
                >
                  <input
                    type={currentQuestion.type === QuestionType.SingleChoice ? 'radio' : 'checkbox'}
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => {
                      if (currentQuestion.type === QuestionType.SingleChoice) {
                        handleAnswerChange(optionLabel);
                      } else {
                        const current = Array.isArray(userAnswers[currentIndex])
                          ? [...userAnswers[currentIndex] as string[]]
                          : [];
                        
                        const newAnswer = current.includes(optionLabel)
                          ? current.filter(a => a !== optionLabel)
                          : [...current, optionLabel];
                        
                        handleAnswerChange(newAnswer);
                      }
                    }}
                    disabled={revealed[currentIndex]}
                    className="mr-2"
                  />
                  <span className="font-medium mr-2">{optionLabel}.</span>
                  <span>{option.content}</span>
                  
                  {revealed[currentIndex] && isCorrect && (
                    <FaCheck className="ml-auto text-green-600" />
                  )}
                  {revealed[currentIndex] && isSelected && !isCorrect && (
                    <FaTimes className="ml-auto text-red-600" />
                  )}
                </label>
              );
            })}
          </div>
        )}
        
        {/* 判断题 */}
        {currentQuestion.type === QuestionType.TrueFalse && (
          <div className="space-y-2 mb-4">
            {[
              { label: '正确', value: 'true' },
              { label: '错误', value: 'false' }
            ].map((option) => {
              const isSelected = userAnswers[currentIndex] === option.value;
              const isCorrect = revealed[currentIndex] && 
                currentQuestion.answer === option.value;
              
              return (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-md border ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200'
                  } ${
                    revealed[currentIndex]
                      ? isCorrect
                        ? 'bg-green-50 border-green-300'
                        : isSelected
                          ? 'bg-red-50 border-red-300'
                          : ''
                      : 'hover:bg-gray-50'
                  } transition-colors cursor-pointer`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(option.value)}
                    disabled={revealed[currentIndex]}
                    className="mr-2"
                  />
                  <span>{option.label}</span>
                  
                  {revealed[currentIndex] && isCorrect && (
                    <FaCheck className="ml-auto text-green-600" />
                  )}
                  {revealed[currentIndex] && isSelected && !isCorrect && (
                    <FaTimes className="ml-auto text-red-600" />
                  )}
                </label>
              );
            })}
          </div>
        )}
        
        {/* 简答题 */}
        {currentQuestion.type === QuestionType.ShortAnswer && (
          <div className="mb-4">
            <textarea
              value={userAnswers[currentIndex] as string || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              disabled={revealed[currentIndex]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={5}
              placeholder="输入您的答案..."
            />
            
            {revealed[currentIndex] && (
              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                <div className="font-semibold text-green-800 mb-1">参考答案：</div>
                <div className="text-green-700">{currentQuestion.answer}</div>
              </div>
            )}
          </div>
        )}
        
        {/* 答案解析 */}
        {revealed[currentIndex] && currentQuestion.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <div className="font-semibold text-blue-800 mb-1">解析：</div>
            <div className="text-blue-700">{currentQuestion.explanation}</div>
          </div>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-md flex items-center ${
            currentIndex === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FaArrowLeft className="mr-1" /> 上一题
        </button>
        
        <button
          onClick={toggleReveal}
          className={`px-4 py-2 rounded-md ${
            revealed[currentIndex]
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {revealed[currentIndex] ? '已显示答案' : '显示答案'}
        </button>
        
        <button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          className={`px-4 py-2 rounded-md flex items-center ${
            currentIndex === questions.length - 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          下一题 <FaArrowRight className="ml-1" />
        </button>
      </div>
    </div>
  );
} 