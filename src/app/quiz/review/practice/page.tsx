'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionType } from '@/types/quiz';
import { getTagColor, QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { shuffleArray } from '@/utils/array';

export interface WrongQuestionDisplay extends Question {
  bankId: string;
  bankName: string;
  userAnswer: string | string[];
  answeredAt: number; 
  originalAnsweredAt?: number; 
  originalUserAnswer?: string | string[];
}


export default function ReviewPracticePage() {
  const router = useRouter();
  const { questionBanks, records, removeWrongRecordsByQuestionId, addRecord, settings } = useQuizStore();

  const [practiceQuestions, setPracticeQuestions] = useState<WrongQuestionDisplay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  const currentQuestion = practiceQuestions[currentIndex];
  
  // 简化打乱选项实现，只改变显示顺序，保持选项ID不变
  const displayedOptions = useMemo(() => {
    if (!currentQuestion || (currentQuestion.type !== QuestionType.SingleChoice && currentQuestion.type !== QuestionType.MultipleChoice)) {
      return currentQuestion?.options || [];
    }
    if (settings.shuffleReviewOptions) {
      return shuffleArray([...(currentQuestion.options || [])]); // 打乱选项的显示顺序
    }
    return currentQuestion.options || [];
  }, [currentQuestion, settings.shuffleReviewOptions]);

  // 获取选项ID对应的显示索引（用于显示答案时转换）
  const getDisplayedLetterForOptionId = useCallback((optionId: string): string => {
    if (!displayedOptions.length) return '';
    const index = displayedOptions.findIndex(opt => opt.id === optionId);
    return index >= 0 ? String.fromCharCode(65 + index) : ''; // 转换为A, B, C, D...
  }, [displayedOptions]);

  // 获取显示索引对应的选项ID（用于用户选择时转换）
  const getOptionIdFromDisplayedIndex = useCallback((index: number): string => {
    if (index < 0 || index >= displayedOptions.length) return '';
    return displayedOptions[index].id;
  }, [displayedOptions]);

  useEffect(() => {
    const wrongRecords = records.filter(r => !r.isCorrect);

    let questionsToPracticeArray: WrongQuestionDisplay[] = wrongRecords.map(record => {
      for (const bank of questionBanks) {
        const question = bank.questions.find(q => q.id === record.questionId);
        if (question) {
          return {
            ...question,
            bankId: bank.id,
            bankName: bank.name,
            userAnswer: '',
            originalAnsweredAt: record.answeredAt,
            originalUserAnswer: record.userAnswer,
            answeredAt: Date.now(),
          };
        }
      }
      return null;
    }).filter(q => q !== null) as WrongQuestionDisplay[];

    if (settings.shuffleReviewQuestionOrder) {
      questionsToPracticeArray = shuffleArray(questionsToPracticeArray);
    }

    const oldCurrentQuestionId = practiceQuestions[currentIndex]?.id;
    
    setPracticeQuestions(questionsToPracticeArray);

    setUserAnswers(prevAnswers => {
        const newAnswers: Record<string, string | string[]> = {};
        questionsToPracticeArray.forEach(q => {
            if (q) {
                newAnswers[q.id] = prevAnswers[q.id] ?? '';
            }
        });
        return newAnswers;
    });

    setRevealed(prevRevealed => {
        const newRevealedState: Record<string, boolean> = {};
        questionsToPracticeArray.forEach(q => {
            if (q) {
                newRevealedState[q.id] = prevRevealed[q.id] ?? false;
            }
        });
        return newRevealedState;
    });

    if (questionsToPracticeArray.length === 0) {
      setIsSessionCompleted(true);
    } else {
      setIsSessionCompleted(false);
      let newCurrentIndex = questionsToPracticeArray.findIndex(q => q && q.id === oldCurrentQuestionId);
      if (newCurrentIndex === -1 || settings.shuffleReviewQuestionOrder) { 
          newCurrentIndex = settings.shuffleReviewQuestionOrder ? 0 : Math.min(currentIndex, questionsToPracticeArray.length - 1);
          newCurrentIndex = Math.max(0, newCurrentIndex); 
      }
      if (questionsToPracticeArray.length > 0) {
        setCurrentIndex(newCurrentIndex);
      }
    }
  }, [records, questionBanks, settings.shuffleReviewQuestionOrder]);

  const checkAnswer = useCallback((question: Question, userAnswer: string | string[]): boolean => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) return false;

    const { type, answer, options = [] } = question;

    if (type === QuestionType.MultipleChoice) {
      const correctAnswers = Array.isArray(answer) ? answer : [];
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
      if (correctAnswers.length !== userAnswerArray.length) return false;
      return correctAnswers.every(a => userAnswerArray.includes(a));
    }

    if (typeof answer === 'string') {
      if (options.length > 0 && answer.length === 1 && answer >= 'A' && answer < String.fromCharCode(65 + options.length)) {
        const correctOptionIndex = answer.charCodeAt(0) - 65;
        if (correctOptionIndex >= 0 && correctOptionIndex < options.length) {
          const correctOptionId = options[correctOptionIndex].id;
          return userAnswer === correctOptionId;
        }
      }
      return userAnswer === answer;
    }
    return false;
  }, []);

  const handleAnswerChange = (answer: string | string[]) => {
    if (!currentQuestion) return;
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [currentQuestion.id]: answer,
    }));
  };

  const toggleReveal = () => {
    if (!currentQuestion) return;

    const alreadyRevealed = revealed[currentQuestion.id];
    
    if (!alreadyRevealed) {
      setRevealed(prevRevealed => ({
        ...prevRevealed,
        [currentQuestion.id]: true,
      }));
        
      const userAnswer = userAnswers[currentQuestion.id] || '';
      const isCorrect = checkAnswer(currentQuestion, userAnswer);
        
      if (isCorrect) {
        if (settings.markMistakeAsCorrectedOnReviewSuccess) {
          removeWrongRecordsByQuestionId(currentQuestion.id);
          addRecord({
            questionId: currentQuestion.id,
            userAnswer: userAnswer,
            isCorrect: true,
            answeredAt: Date.now()
          });
        }
      } else {
        removeWrongRecordsByQuestionId(currentQuestion.id);
        addRecord({
          questionId: currentQuestion.id,
          userAnswer: userAnswer,
          isCorrect: false,
          answeredAt: Date.now()
        });
      }
    } else {
      nextQuestion(); 
    }
  };

  const nextQuestion = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSessionCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isSessionCompleted || (practiceQuestions.length === 0 && records.filter(r => !r.isCorrect).length === 0)) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          {(practiceQuestions.length === 0 && records.filter(r => !r.isCorrect).length === 0) ? '太棒了！所有错题都已订正完毕！' : '错题重做已完成！'}
        </h1>
        <FaCheck className="text-6xl text-green-500 dark:text-green-400 mb-8" />
        <button
          onClick={() => router.push('/quiz/review')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-lg"
        >
          返回错题本
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          {practiceQuestions.length === 0 && !isSessionCompleted ? '正在加载错题...' : '所有错题已练习完毕或列表为空。'}
        </p>
         <button
          onClick={() => router.push('/quiz/review')}
          className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-lg"
        >
          返回错题本
        </button>
      </div>
    );
  }

  const currentAnswer = userAnswers[currentQuestion.id] || '';
  const isCurrentRevealed = revealed[currentQuestion.id] || false;

  // Determine the true correct option ID for single choice questions, used for styling
  let trueCorrectOptionIdForSingleChoice: string | null = null;
  if (currentQuestion && currentQuestion.type === QuestionType.SingleChoice && typeof currentQuestion.answer === 'string') {
    const { answer, options = [] } = currentQuestion;
    if (options.length > 0 && answer.length === 1 && answer >= 'A' && answer < String.fromCharCode(65 + options.length)) {
      const correctOptionIndex = answer.charCodeAt(0) - 65;
      if (correctOptionIndex >= 0 && correctOptionIndex < options.length) {
        trueCorrectOptionIdForSingleChoice = options[correctOptionIndex].id;
      }
    } else {
      trueCorrectOptionIdForSingleChoice = answer; // Assume it's an ID
    }
  }

  return (
    <div className="dark:bg-gray-900 dark:text-white min-h-screen p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          错题重做练习
        </h1>
        <div className="text-gray-600 dark:text-gray-400">
          {practiceQuestions.length > 0 ? `${currentIndex + 1} / ${practiceQuestions.length}` : '0 / 0'}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className={`px-2 py-1 ${getTagColor(QUESTION_TYPE_NAMES[currentQuestion.type] || currentQuestion.type)} rounded-md mr-2`}>
                {QUESTION_TYPE_NAMES[currentQuestion.type] || currentQuestion.type}
            </span>
            <span>错题来源: {currentQuestion.bankName} (ID: {currentQuestion.id.substring(0,8)})</span>
        </div>
        <div className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {currentQuestion.content}
        </div>
        <div className="space-y-3 mb-4">
          {currentQuestion.type === QuestionType.SingleChoice && displayedOptions.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isCorrectOption = option.id === trueCorrectOptionIdForSingleChoice;
            const isSelected = currentAnswer === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleAnswerChange(option.id)} 
                disabled={isCurrentRevealed}
                className={`w-full text-left p-3 rounded-md border transition-colors
                  ${isCurrentRevealed
                    ? (isCorrectOption
                        ? (isSelected ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200')
                        : (isSelected ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'))
                    : (isSelected 
                        ? 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300')
                  }`}
              >
                <span className="font-medium mr-2">{optionLetter}.</span>
                {option.content}
              </button>
            );
          })}
          {currentQuestion.type === QuestionType.MultipleChoice && displayedOptions.map((option, index) => {
            // 转换选项字母标识
            const optionLetter = String.fromCharCode(65 + index);
            // 处理用户答案数组
            const userAnswerArray = Array.isArray(currentAnswer) ? currentAnswer as string[] : [];
            const isSelected = userAnswerArray.includes(option.id);
            // 检查这个选项是否属于正确答案集合
            const correctAnswers = Array.isArray(currentQuestion.answer) ? currentQuestion.answer : [];
            const isCorrectOption = correctAnswers.includes(option.id);
            
            return (
              <button
                key={option.id}
                onClick={() => {
                  const currentAnswers = Array.isArray(currentAnswer) ? [...currentAnswer as string[]] : [];
                  if (isSelected) {
                    handleAnswerChange(currentAnswers.filter(ans => ans !== option.id));
                  } else {
                    handleAnswerChange([...currentAnswers, option.id]);
                  }
                }}
                disabled={isCurrentRevealed}
                className={`w-full text-left p-3 rounded-md border transition-colors
                  ${isCurrentRevealed
                    ? (isCorrectOption
                        ? (isSelected ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200')
                        : (isSelected ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'))
                    : (isSelected 
                        ? 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300')
                  }`}
              >
                <span className="font-medium mr-2">{optionLetter}.</span>
                {option.content}
              </button>
            );
          })}
          {currentQuestion.type === QuestionType.TrueFalse && ["true", "false"].map((val, index) => (
            <button
              key={val}
              onClick={() => handleAnswerChange(val)}
              disabled={isCurrentRevealed}
              className={`w-full text-left p-3 rounded-md border transition-colors
                ${isCurrentRevealed
                  ? (currentQuestion.answer === val
                      ? (currentAnswer === val ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200')
                      : (currentAnswer === val ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'))
                  : (currentAnswer === val 
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
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={3}
              disabled={isCurrentRevealed}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
              placeholder="在此输入您的答案..."
            />
          )}
        </div>
        {isCurrentRevealed && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">答案与解析</h3>
            <div className={`p-3 rounded-md mb-2 text-sm 
              ${checkAnswer(currentQuestion, currentAnswer) 
                ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300'}`}
            >
              <p><span className="font-medium">您的答案:</span> {
                currentQuestion.type === QuestionType.MultipleChoice 
                ? (Array.isArray(currentAnswer) && (currentAnswer as string[]).length > 0 
                    ? (currentAnswer as string[]).map(ans => {
                        const index = displayedOptions.findIndex(opt => opt.id === ans);
                        return index >= 0 ? `${String.fromCharCode(65 + index)}` : ans;
                      }).join(', ') 
                    : '未作答') 
                : currentQuestion.type === QuestionType.TrueFalse 
                    ? (currentAnswer === 'true' ? '正确' : (currentAnswer === 'false' ? '错误' : '未作答'))
                    : currentQuestion.type === QuestionType.SingleChoice
                      ? (currentAnswer ? `${displayedOptions.findIndex(opt => opt.id === currentAnswer) >= 0 ? String.fromCharCode(65 + displayedOptions.findIndex(opt => opt.id === currentAnswer)) : currentAnswer}` : '未作答')
                      : currentAnswer || '未作答'
              }</p>
              <p><span className="font-medium">正确答案:</span> {
                currentQuestion.type === QuestionType.MultipleChoice 
                ? (Array.isArray(currentQuestion.answer) 
                    ? currentQuestion.answer.map(ans => {
                        const index = displayedOptions.findIndex(opt => opt.id === ans);
                        if (index >= 0) return String.fromCharCode(65 + index);
                        if (typeof ans === 'string' && ans.length === 1 && ans >= 'A' && ans < String.fromCharCode(65 + displayedOptions.length)) return ans;
                        return `(${ans})`; 
                      }).join(', ') 
                    : '-') 
                : currentQuestion.type === QuestionType.TrueFalse
                    ? (currentQuestion.answer === 'true' ? '正确' : '错误')
                    : currentQuestion.type === QuestionType.SingleChoice && typeof currentQuestion.answer === 'string'
                      ? (() => {
                          if (currentQuestion.options && currentQuestion.options.length > 0 && currentQuestion.answer.length === 1 && currentQuestion.answer >= 'A' && currentQuestion.answer < String.fromCharCode(65 + currentQuestion.options.length)) {
                            const originalCorrectOptionIndex = currentQuestion.answer.charCodeAt(0) - 65;
                            if (originalCorrectOptionIndex < currentQuestion.options.length) {
                                const originalCorrectOptionId = currentQuestion.options[originalCorrectOptionIndex].id;
                                return getDisplayedLetterForOptionId(originalCorrectOptionId) || `(${currentQuestion.answer})`;
                            }
                          }
                          const letterById = getDisplayedLetterForOptionId(currentQuestion.answer);
                          return letterById || `(${currentQuestion.answer || '未指定'})`;
                        })()
                      : currentQuestion.answer
              }</p>
              {currentQuestion.originalUserAnswer && (
                <p className="mt-1 italic text-xs"><span className="font-medium">原始错误答案:</span> {
                  currentQuestion.type === QuestionType.MultipleChoice 
                    ? (Array.isArray(currentQuestion.originalUserAnswer) && (currentQuestion.originalUserAnswer as string[]).length > 0 
                        ? (currentQuestion.originalUserAnswer as string[]).map(ans => {
                            // 显示选项内容，因为这是过去的答案，与当前显示顺序无关
                            const option = currentQuestion.options?.find(opt => opt.id === ans);
                            return option ? option.content : ans;
                          }).join(', ') 
                        : '未记录') 
                  : currentQuestion.type === QuestionType.TrueFalse 
                      ? (currentQuestion.originalUserAnswer === 'true' ? '正确' : (currentQuestion.originalUserAnswer === 'false' ? '错误' : '未记录'))
                      : currentQuestion.type === QuestionType.SingleChoice
                        ? (currentQuestion.originalUserAnswer
                            ? (currentQuestion.options?.find(opt => opt.id === currentQuestion.originalUserAnswer)?.content || currentQuestion.originalUserAnswer) 
                            : '未记录')
                        : currentQuestion.originalUserAnswer || '未记录'
                }</p>
              )}
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
            ${isCurrentRevealed
              ? (checkAnswer(currentQuestion, currentAnswer) 
                  ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white' 
                  : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white')
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white'
          }`}
        >
          {isCurrentRevealed ? (checkAnswer(currentQuestion, currentAnswer) ? '正确! (下一题)' : '错误 (下一题)') : '显示答案'}
        </button>
        <button
          onClick={nextQuestion}
          disabled={currentIndex === practiceQuestions.length - 1 && !isCurrentRevealed} 
          className={`px-4 py-2 rounded-md flex items-center transition-colors
            ${(currentIndex === practiceQuestions.length - 1 && !isCurrentRevealed) 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          {currentIndex === practiceQuestions.length - 1 ? '完成练习' : '下一题'}
          <FaArrowRight className="ml-1" />
        </button>
      </div>
    </div>
  );
} 