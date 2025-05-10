'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionType, QuestionOption } from '@/types/quiz';
import { getTagColor, QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { shuffleArray } from '@/utils/array'; // <--- Import shuffleArray

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bankId = searchParams.get('bankId');
  // Destructure settings from useQuizStore
  const { questionBanks, addRecord, getQuestionBankById, settings } = useQuizStore(); 

  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({}); // ID-based answers
  const [revealed, setRevealed] = useState<Record<string, boolean>>({}); // ID-based revealed state
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  useEffect(() => {
    if (bankId) {
      const bank = getQuestionBankById(bankId);
      if (bank) {
        let questionsToPractice = [...bank.questions];
        // Apply shuffle question order setting
        if (settings.shufflePracticeQuestionOrder) {
          questionsToPractice = shuffleArray(questionsToPractice);
        }
        setPracticeQuestions(questionsToPractice);
        
        // Initialize states for the loaded questions
        const initialAnswers: Record<string, string | string[]> = {};
        const initialRevealed: Record<string, boolean> = {};
        questionsToPractice.forEach(q => {
          initialAnswers[q.id] = '';
          initialRevealed[q.id] = false;
        });
        setUserAnswers(initialAnswers);
        setRevealed(initialRevealed);
        setCurrentIndex(0);
        setIsSessionCompleted(questionsToPractice.length === 0);
      } else {
        // Bank not found, redirect or show error
        router.push('/quiz'); 
      }
    } else {
      // No bankId, redirect or show error
      router.push('/quiz');
    }
  }, [bankId, getQuestionBankById, settings.shufflePracticeQuestionOrder, router]); // Add settings.shufflePracticeQuestionOrder

  const currentQuestion = practiceQuestions[currentIndex];

  // Memoize shuffled options for the current question if setting is enabled
  const displayedOptions = useMemo(() => {
    if (!currentQuestion || (currentQuestion.type !== QuestionType.SingleChoice && currentQuestion.type !== QuestionType.MultipleChoice)) {
      return currentQuestion?.options || [];
    }
    if (settings.shufflePracticeOptions) {
      return shuffleArray([...(currentQuestion.options || [])]); // Shuffle a copy
    }
    return currentQuestion.options || [];
  }, [currentQuestion, settings.shufflePracticeOptions]);

  const checkAnswer = useCallback((question: Question, userAnswer: string | string[]): boolean => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) return false;
    if (question.type === QuestionType.MultipleChoice) {
      const correctAnswers = Array.isArray(question.answer) ? question.answer : [];
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [];
      if (correctAnswers.length !== userAnswerArray.length) return false;
      return correctAnswers.every(a => userAnswerArray.includes(a));
    }
    return userAnswer === question.answer;
  }, []);

  const handleAnswerChange = (answer: string | string[]) => {
    if (!currentQuestion) return;
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const toggleReveal = () => {
    if (!currentQuestion) return;
    const alreadyRevealed = revealed[currentQuestion.id];

    if (!alreadyRevealed) {
      setRevealed(prev => ({ ...prev, [currentQuestion.id]: true }));
      addRecord({
        questionId: currentQuestion.id,
        userAnswer: userAnswers[currentQuestion.id] || '',
        isCorrect: checkAnswer(currentQuestion, userAnswers[currentQuestion.id] || ''),
        answeredAt: Date.now(),
      });
    } else {
        nextQuestion(); // If already revealed, middle button acts as next question
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

  if (!bankId || (!currentQuestion && !isSessionCompleted && practiceQuestions.length === 0)) {
    // Loading state or if bank/questions are not found initially
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">正在加载练习题目或题库不存在...</p>
        <button onClick={() => router.push('/quiz')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md">返回题库列表</button>
      </div>
    );
  }
  
  if (isSessionCompleted) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">练习已完成！</h1>
        <FaCheck className="text-6xl text-green-500 dark:text-green-400 mb-8" />
        <div className="flex space-x-4">
            <button
            onClick={() => router.push('/quiz')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md text-lg"
            >
            返回题库列表
            </button>
            <button
            onClick={() => router.push('/quiz/review')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-md text-lg"
            >
            查看错题本
            </button>
        </div>
      </div>
    );
  }

  const currentAnswer = userAnswers[currentQuestion.id] || '';
  const isCurrentRevealed = revealed[currentQuestion.id] || false;
  const isCorrect = isCurrentRevealed ? checkAnswer(currentQuestion, currentAnswer) : false;

  return (
    <div className="dark:bg-gray-900 dark:text-white min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            练习模式: {getQuestionBankById(bankId)?.name || '题库'}
            </h1>
            <div className="text-gray-600 dark:text-gray-400">
            题目: {currentIndex + 1} / {practiceQuestions.length}
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className={`px-2 py-1 ${getTagColor(QUESTION_TYPE_NAMES[currentQuestion.type] || currentQuestion.type)} rounded-md mr-2`}>
                    {QUESTION_TYPE_NAMES[currentQuestion.type] || currentQuestion.type}
                </span>
                {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                    <span className="mr-2">标签: {currentQuestion.tags.join(', ')}</span>
                )}
            </div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white mb-4 whitespace-pre-wrap">
            {currentQuestion.content}
            </div>
            <div className="space-y-3 mb-4">
            {/* Use displayedOptions (which may be shuffled) for rendering */} 
            {currentQuestion.type === QuestionType.SingleChoice && displayedOptions.map((option, index) => (
                <button
                key={option.id} // Key is stable option.id
                onClick={() => handleAnswerChange(option.id)}
                disabled={isCurrentRevealed}
                className={`w-full text-left p-3 rounded-md border transition-colors
                    ${isCurrentRevealed
                    ? (checkAnswer(currentQuestion, option.id) // Is this option the correct one?
                        ? (currentAnswer === option.id ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700' : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-200')
                        : (currentAnswer === option.id ? 'bg-red-500 border-red-500 text-white dark:bg-red-700 dark:border-red-700' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'))
                    : (currentAnswer === option.id 
                        ? 'bg-blue-500 border-blue-500 text-white dark:bg-blue-600 dark:border-blue-600' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300')
                    }`}
                >
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                {option.content}
                </button>
            ))}
            {currentQuestion.type === QuestionType.MultipleChoice && displayedOptions.map((option, index) => {
                const userAnswerArray = Array.isArray(currentAnswer) ? currentAnswer as string[] : [];
                const isSelected = userAnswerArray.includes(option.id);
                const isCorrectOption = Array.isArray(currentQuestion.answer) && currentQuestion.answer.includes(option.id);
                return (
                <button
                    key={option.id} // Key is stable option.id
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
                    <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
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
                ${isCorrect 
                    ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300'}`}
                >
                <p><span className="font-medium">您的答案:</span> {
                    currentQuestion.type === QuestionType.MultipleChoice 
                    ? (Array.isArray(currentAnswer) && (currentAnswer as string[]).length > 0 
                        ? (currentAnswer as string[]).map(ansId => currentQuestion.options?.find(opt => opt.id === ansId)?.content || ansId).join(', ') 
                        : '未作答') 
                    : currentQuestion.type === QuestionType.TrueFalse 
                        ? (currentAnswer === 'true' ? '正确' : (currentAnswer === 'false' ? '错误' : '未作答'))
                        : currentAnswer || '未作答'
                }</p>
                <p><span className="font-medium">正确答案:</span> {
                    currentQuestion.type === QuestionType.MultipleChoice 
                    ? (Array.isArray(currentQuestion.answer) 
                        ? currentQuestion.answer.map(ansId => currentQuestion.options?.find(opt => opt.id === ansId)?.content || ansId).join(', ') 
                        : '-') 
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

        <div className="flex justify-between mt-8">
            <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className={`px-5 py-2.5 rounded-lg flex items-center transition-colors text-sm font-medium
                ${currentIndex === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
            >
            <FaArrowLeft className="mr-2" /> 上一题
            </button>
            <button
            onClick={toggleReveal}
            className={`px-5 py-2.5 rounded-lg font-semibold transition-colors text-white text-sm
                ${isCurrentRevealed
                ? (isCorrect 
                    ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' 
                    : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800')
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
            >
            {isCurrentRevealed ? (isCorrect ? <FaCheck className="mr-2"/> : <FaTimes className="mr-2"/>) : <FaEye className="mr-2"/>}
            {isCurrentRevealed ? (isCorrect ? '答对了! (下一题)' : '答错了 (下一题)') : '显示答案'}
            </button>
            <button
            onClick={nextQuestion}
            disabled={currentIndex === practiceQuestions.length - 1 && !isCurrentRevealed}
            className={`px-5 py-2.5 rounded-lg flex items-center transition-colors text-sm font-medium
                ${(currentIndex === practiceQuestions.length - 1 && !isCurrentRevealed)
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
            >
            {currentIndex === practiceQuestions.length - 1 ? '完成练习' : '下一题'}
            <FaArrowRight className="ml-2" />
            </button>
        </div>
      </div>
    </div>
  );
}
