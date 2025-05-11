'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaLightbulb, FaCheckCircle, FaTimesCircle, FaRedo, FaCog } from 'react-icons/fa';
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionBank, QuestionType, QuestionOption } from '@/types/quiz';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QUESTION_TYPE_NAMES } from '@/constants/quiz';
import NumQuestionsModal from '@/components/NumQuestionsModal';
import { BeatLoader } from 'react-spinners';
import { useThemeStore } from '@/store/themeStore';
import { shuffleArray } from '@/utils/array';

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bankId = searchParams.get('bankId');
  const mode = searchParams.get('mode'); // 获取练习模式
  const isReviewMode = mode === 'review'; // 是否是错题练习模式
  
  const { 
    settings, 
    getQuestionBankById, 
    addRecord,
    removeWrongRecordsByQuestionId,
    records, // 获取错题记录
  } = useQuizStore();
  const { theme } = useThemeStore();

  const [currentBank, setCurrentBank] = useState<QuestionBank | null>(null);
  const [allBankQuestions, setAllBankQuestions] = useState<Question[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<(Question & { originalUserAnswer?: string | string[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 新增状态：用于存储总用时（秒）
  const [isLoading, setIsLoading] = useState(true);
  const [isNumQuestionsModalOpen, setIsNumQuestionsModalOpen] = useState(false);

  // 提前定义 currentQuestion 和相关 useMemo Hooks
  const currentQuestion = practiceQuestions[currentQuestionIndex];
  
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion || !userAnswers[currentQuestion.id]) return false;
    const answer = userAnswers[currentQuestion.id];
    return Array.isArray(answer) ? answer.length > 0 : answer !== '';
  }, [currentQuestion, userAnswers]);

  const isLastQuestion = useMemo(() => 
    currentQuestionIndex === practiceQuestions.length - 1 && practiceQuestions.length > 0
  , [currentQuestionIndex, practiceQuestions.length]);

  const canPressNext = useMemo(() => {
    if (isLastQuestion) {
      return isCurrentQuestionAnswered;
    } else {
      return isCurrentQuestionAnswered || showAnswer;
    }
  }, [isLastQuestion, isCurrentQuestionAnswered, showAnswer]);

  useEffect(() => {
    if (!bankId) {
      router.push('/quiz');
      return;
    }

      const bank = getQuestionBankById(bankId);
      if (bank) {
      setCurrentBank(bank);
      
      if (isReviewMode) {
        const wrongRecords = records.filter(r => !r.isCorrect);
        let wrongQuestionsFromBank = bank.questions
          .filter(question => wrongRecords.some(record => record.questionId === question.id))
          .map(q => {
            const originalRecord = wrongRecords.find(r => r.questionId === q.id);
            return {
              ...q,
              originalUserAnswer: originalRecord ? originalRecord.userAnswer : undefined,
            } as Question & { originalUserAnswer?: string | string[] }; // 类型断言
          });

        if (wrongQuestionsFromBank.length === 0) {
          router.push('/quiz/review');
          return;
        }
        
        setAllBankQuestions(wrongQuestionsFromBank);
        let questionsToSet = [...wrongQuestionsFromBank];
        
        if (settings.shuffleReviewQuestionOrder) {
          questionsToSet = shuffleArray([...questionsToSet]);
        }
        
        if (settings.shuffleReviewOptions) {
          questionsToSet = questionsToSet.map(q_item => {
            if (q_item.options && q_item.type !== QuestionType.TrueFalse && q_item.options.length > 1) {
              const shuffledOptions = shuffleArray([...q_item.options]);
              return { ...q_item, options: shuffledOptions };
            }
            return q_item;
          });
        }
        
        setPracticeQuestions(questionsToSet);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowAnswer(false);
        setQuizCompleted(false);
        setStartTime(Date.now());
        setIsLoading(false);
      } else {
        const loadedQuestions = bank.questions.map(q => ({...q, options: q.options ? [...q.options] : []}));
        setAllBankQuestions(loadedQuestions);
        if (practiceQuestions.length === 0 && loadedQuestions.length > 0 && !quizCompleted) { 
          setIsNumQuestionsModalOpen(true);
        }
        setIsLoading(false);
      }
    } else {
      router.push('/quiz');
    }
  }, [bankId, getQuestionBankById, isReviewMode, records, router, settings.shuffleReviewOptions, settings.shuffleReviewQuestionOrder, settings.markMistakeAsCorrectedOnReviewSuccess, quizCompleted]); // Added router to dependency array

  const handleNumQuestionsSubmit = (numToPractice: number) => {
    setIsNumQuestionsModalOpen(false);
    let questionsToSet = [...allBankQuestions];
    
    // 应用题目随机排序设置
    if (settings.shufflePracticeQuestionOrder) {
      questionsToSet = shuffleArray([...questionsToSet]); // 使用更可靠的 shuffleArray 函数
    }
    
    const finalNumToPractice = Math.max(1, Math.min(numToPractice, questionsToSet.length));
    questionsToSet = questionsToSet.slice(0, finalNumToPractice);

    // 应用选项随机排序设置
    if (settings.shufflePracticeOptions) {
      questionsToSet = questionsToSet.map(q => {
        if (q.options && q.type !== QuestionType.TrueFalse && q.options.length > 1) {
          // 深拷贝选项并随机排序，但确保不影响原始数据
          const shuffledOptions = shuffleArray([...q.options]);
          return { ...q, options: shuffledOptions };
        }
        return q;
      });
    }
    
    setPracticeQuestions(questionsToSet);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setQuizCompleted(false);
    setStartTime(Date.now());
  };
  
  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion || showAnswer) return;
    let newAnswer: string | string[];
    if (currentQuestion.type === QuestionType.MultipleChoice) {
      const currentSelected = (userAnswers[currentQuestion.id] as string[] || []);
      if (currentSelected.includes(optionId)) {
        newAnswer = currentSelected.filter(id => id !== optionId);
      } else {
        newAnswer = [...currentSelected, optionId];
      }
    } else {
      newAnswer = optionId;
    }
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: newAnswer }));
  };

  const handleShowAnswer = () => {
    if (!currentQuestion) return;
    setShowAnswer(true);
  };
  
  const checkIsCorrect = (question: Question, userAnswer: string | string[] | undefined): boolean => {
    if (userAnswer === undefined || userAnswer === null) return false;
    if (question.type === QuestionType.MultipleChoice) {
      if (!Array.isArray(question.answer) || !Array.isArray(userAnswer)) return false;
      const correctAnswers = new Set(question.answer as string[]);
      const userAnswersSet = new Set(userAnswer as string[]);
      if (correctAnswers.size === 0 && userAnswersSet.size === 0) return true;
      return correctAnswers.size === userAnswersSet.size && [...correctAnswers].every(ans => userAnswersSet.has(ans));
    } else if (question.type === QuestionType.TrueFalse) {
        return (userAnswer as string).toLowerCase() === (question.answer as string).toLowerCase();
    }
    return userAnswer === question.answer;
  };

  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    setShowAnswer(false);
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = () => {
    practiceQuestions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = checkIsCorrect(question, userAnswer);

      removeWrongRecordsByQuestionId(question.id);

      if (!isCorrect) {
      addRecord({
          questionId: question.id,
          userAnswer: userAnswer || '',
          isCorrect: false,
        answeredAt: Date.now(),
      });
    } else {
        if (isReviewMode && settings.markMistakeAsCorrectedOnReviewSuccess) {
          addRecord({
            questionId: question.id,
            userAnswer: userAnswer || '',
            isCorrect: true,
            answeredAt: Date.now(),
          });
        }
      }
    });
    setQuizCompleted(true);
    if (startTime) {
      setElapsedTime((Date.now() - startTime) / 1000);
    }
  };
  
  // 获取完成练习时的标题
  const getCompletionTitle = () => {
    if (isReviewMode) {
      return '错题练习完成！';
    }
    return '练习完成!';
  };

  const handleManageBankClick = () => {
    if (bankId) {
      console.log("使用表单提交传递 bankId:", bankId);
      
      // 创建一个临时表单元素
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = '/quiz/banks/manage/';
      form.style.display = 'none';
      
      // 添加 bankId 作为参数
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'tempBankId';
      input.value = bankId;
      form.appendChild(input);
      
      // 添加到文档并提交
      document.body.appendChild(form);
      form.submit();
    }
  };

  // ----- Render Logic Starts Here -----

  if (isLoading && !isNumQuestionsModalOpen) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <BeatLoader color={theme === 'dark' ? '#38BDF8' : '#3B82F6'} />
        <p className="text-gray-600 dark:text-gray-400 mt-4">加载题库中...</p>
      </div>
    );
  }
  
  if (isNumQuestionsModalOpen && currentBank) {
    return (
      <NumQuestionsModal
        isOpen={isNumQuestionsModalOpen}
        onClose={() => {
          setIsNumQuestionsModalOpen(false);
          if (practiceQuestions.length === 0) {
            router.back();
          }
        }}
        onSubmit={handleNumQuestionsSubmit}
        totalQuestions={allBankQuestions.length}
        bankName={currentBank.name}
      />
    );
  }

  if (!currentBank && !isLoading) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <FaTimesCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>无法加载题库或题库ID无效。</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/quiz')} className="mt-6"> 返回题库列表 </Button>
      </div>
    );
  }

  if (practiceQuestions.length === 0 && !isLoading && !isNumQuestionsModalOpen && currentBank) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <Alert className="max-w-lg">
          <FaLightbulb className="h-4 w-4" />
          <AlertTitle>题库为空</AlertTitle>
          <AlertDescription>此题库中没有题目。请先添加题目。</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/quiz/banks/${bankId}`)} className="mt-6">
          返回题库详情
        </Button>
      </div>
    );
  }

  if (quizCompleted) {
    const correctCount = practiceQuestions.filter(q => checkIsCorrect(q, userAnswers[q.id])).length;
    const totalPracticed = practiceQuestions.length;
    const accuracy = totalPracticed > 0 ? ((correctCount / totalPracticed) * 100).toFixed(1) : 0;
    const practiceTime = startTime ? ((Date.now() - startTime) / 1000).toFixed(0) : 0;

  return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-start pt-12">
        <Card className="w-full max-w-2xl text-center shadow-2xl animate-fade-in">
          <CardHeader><CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">{getCompletionTitle()}</CardTitle></CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
            <p className="text-lg text-gray-700 dark:text-gray-200">您已完成本次练习。</p>
            {/* Statistics Section */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-left py-4 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
              <div><p className="text-sm text-gray-500 dark:text-gray-400">练习题数:</p><p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{totalPracticed} 题</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">答对题数:</p><p className="text-xl font-semibold text-green-600 dark:text-green-400">{correctCount} 题</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">正确率:</p><p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{accuracy}%</p></div>
              <div><p className="text-sm text-gray-500 dark:text-gray-400">用时:</p><p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{practiceTime} 秒</p></div>
            </div>

            {/* Detailed Question Review Section */}
            <div className="mt-6 text-left">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">答题回顾:</h3>
              {practiceQuestions.length > 0 ? (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 border dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                  {practiceQuestions.map((question, index) => {
                    const userAnswer = userAnswers[question.id];
                    const isCorrect = checkIsCorrect(question, userAnswer);
                    let userAnswerDisplay = '未作答';
                    if (userAnswer !== undefined) {
                      if (question.type === QuestionType.MultipleChoice) {
                        userAnswerDisplay = Array.isArray(userAnswer) && userAnswer.length > 0 && question.options
                          ? userAnswer.map(ansId => (question.options || []).find(opt => opt.id === ansId)?.content || ansId).join(', ') 
                          : '未作答';
                      } else if (question.type === QuestionType.TrueFalse) {
                        userAnswerDisplay = userAnswer === 'true' ? '正确' : (userAnswer === 'false' ? '错误' : '未作答');
                      } else if (question.options && question.options.length > 0) { // Single Choice from options
                        userAnswerDisplay = (question.options || []).find(opt => opt.id === userAnswer)?.content || (userAnswer as string || '未作答');
                      } else { // Short Answer, FillInBlank
                        userAnswerDisplay = userAnswer as string || '未作答';
                      }
                    }

                    let correctAnswerDisplay = '';
                    if (question.type === QuestionType.MultipleChoice) {
                        correctAnswerDisplay = Array.isArray(question.answer) && question.options
                            ? question.answer.map(ansId => (question.options || []).find(opt => opt.id === ansId)?.content || ansId).join(', ') 
                            : 'N/A';
                    } else if (question.type === QuestionType.TrueFalse) {
                        correctAnswerDisplay = question.answer === 'true' ? '正确' : '错误';
                    } else if (question.options && question.options.length > 0) { // Single Choice from options
                        correctAnswerDisplay = (question.options || []).find(opt => opt.id === question.answer)?.content || (question.answer as string || 'N/A');
                    } else { // Short Answer, FillInBlank
                        correctAnswerDisplay = question.answer as string || 'N/A';
                    }

                    const userAnswerCorrect = isCorrect;

                    return (
                      <div key={question.id} className={`p-3 rounded-md shadow-sm ${isCorrect ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                          {index + 1}. {question.content}
                          <span className={`ml-2 text-xs font-bold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            ({isCorrect ? '正确' : '错误'})
                </span>
                        </p>
                        {/* 显示用户答案 */}
                        <p className={`text-sm ${userAnswerCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          <span className="font-semibold">你的答案:</span> {userAnswerDisplay}
                        </p>
                        
                        {/* 显示正确答案 (如果用户答错了) */}
                        {!userAnswerCorrect && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">正确答案:</span> {correctAnswerDisplay}
                          </p>
                        )}

                        {/* 在错题回顾模式下，如果答错了，显示最初的错误答案 */}
                        {isReviewMode && !userAnswerCorrect && (question as any).originalUserAnswer && (
                          <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                            <span className="font-semibold">最初错误答案:</span> {
                              (() => {
                                const q = question as any;
                                const originalAns = q.originalUserAnswer;
                                if (q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) {
                                  const currentQOptions = q.options;
                                  if (!currentQOptions || currentQOptions.length === 0) return "选项数据缺失";

                                  const originalAnswerArray = Array.isArray(originalAns) ? originalAns : [originalAns].filter(Boolean);
                                  return originalAnswerArray.map((ansId: string) => {
                                    const option = currentQOptions.find((opt: QuestionOption) => opt.id === ansId);
                                    if (option) {
                                      const optionIndex = currentQOptions.findIndex((opt: QuestionOption) => opt.id === ansId);
                                      return `${String.fromCharCode(65 + (optionIndex ?? 0))}. ${option.content}`;
                                    }
                                    return `未知选项ID: ${ansId}`;
                                  }).join(', ') || "未记录";
                                } else if (q.type === QuestionType.TrueFalse) {
                                  return originalAns === 'true' ? '正确' : (originalAns === 'false' ? '错误' : (originalAns || "未记录"));
                                } else {
                                  return originalAns || "未记录";
                                }
                              })()
                            }
                          </p>
                        )}

                        {/* 显示题目解析 */}
                        {question.explanation && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words">
                              <span className="font-semibold">解析:</span> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">没有练习题目记录。</p>
                )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
            <Button onClick={() => router.push('/quiz')} variant="outline" className="w-full sm:w-auto"><FaArrowLeft className="mr-2" /> 返回题库列表</Button>
            <Button onClick={() => {
              if (!bankId) {
                router.push('/quiz');
                return;
              }
              const bank = getQuestionBankById(bankId);
              if (!bank) {
                router.push('/quiz');
                return;
              }

              setCurrentBank(bank); 
              const loadedQuestions = bank.questions.map(q => ({ ...q, options: q.options ? [...q.options] : [] }));
              setAllBankQuestions(loadedQuestions);
              setPracticeQuestions([]); 
              setQuizCompleted(false);
              setCurrentQuestionIndex(0);
              setUserAnswers({});
              setShowAnswer(false);
              setStartTime(null);
              setElapsedTime(0); // 重置已用时间
              setIsLoading(false); // 确保 loading 状态解除

              if (isReviewMode) {
                // 错题回顾模式：直接重新加载错题，不显示数量选择
                // useEffect 将会因为 bankId 和 isReviewMode 未变而重新获取错题
                // 需要确保 useEffect 能够正确处理再次加载的逻辑，可能需要触发它
                // 或者直接在这里调用类似 useEffect 内部的错题加载逻辑
                // 为了简单起见，我们先依赖 useEffect 的重新触发，但可能需要调整依赖项或手动触发。
                // 一个更直接的方式是重新导航，但这可能导致页面闪烁。
                // 暂时我们先重置状态，期望 useEffect 捕获 bankId 和 isReviewMode 的依赖，并重新加载。 
                // 如果不行，我们再考虑强制刷新或更复杂的逻辑。
                // router.push(`/quiz/practice?bankId=${bankId}&mode=review&t=${Date.now()}`); // 强制刷新
                // 实际上，我们应该直接重新构建练习状态，类似于 useEffect 里的逻辑
                const wrongRecords = records.filter(r => !r.isCorrect);
                let wrongQuestionsFromBank = bank.questions
                  .filter(question => wrongRecords.some(record => record.questionId === question.id))
                  .map(q => {
                    const originalRecord = wrongRecords.find(r => r.questionId === q.id);
                    return {
                      ...q,
                      originalUserAnswer: originalRecord ? originalRecord.userAnswer : undefined,
                    } as Question & { originalUserAnswer?: string | string[] };
                  });
                if (wrongQuestionsFromBank.length === 0) {
                    router.push('/quiz/review'); // 如果没有错题了，返回错题本
                    return;
                }
                let questionsToSet = [...wrongQuestionsFromBank];
                if (settings.shuffleReviewQuestionOrder) {
                  questionsToSet = shuffleArray([...questionsToSet]);
                }
                if (settings.shuffleReviewOptions) {
                  questionsToSet = questionsToSet.map(q_item => {
                    if (q_item.options && q_item.type !== QuestionType.TrueFalse && q_item.options.length > 1) {
                      return { ...q_item, options: shuffleArray([...q_item.options]) };
                    }
                    return q_item;
                  });
                }
                setPracticeQuestions(questionsToSet);
                setStartTime(Date.now());

              } else {
                // 普通练习模式
                if (loadedQuestions.length > 0) {
                  setIsNumQuestionsModalOpen(true);
                } else {
                  // 题库为空，可以给个提示或直接返回
                  // For now, do nothing, page will show empty state based on practiceQuestions.length === 0
                }
              }
            }} className="w-full sm:w-auto">
              <FaRedo className="mr-2" /> 再次练习该题库
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentQuestion && !isLoading) {
    return (
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">题目加载失败或题库为空。</p>
        <Button onClick={() => router.push('/quiz')} className="mt-4">返回题库列表</Button>
            </div>
    );
  }
  
  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  const renderOptions = () => {
    if (!currentQuestion || !currentQuestion.options) return null;
    const isMcq = currentQuestion.type === QuestionType.MultipleChoice;
    const currentSelection = userAnswers[currentQuestion.id];
    return currentQuestion.options.map((option, index) => {
      const optionLetter = getOptionLetter(index);
      const isSelected = isMcq ? (currentSelection as string[] || []).includes(option.id) : currentSelection === option.id;
      let buttonClass = 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
      let indicator = null;
      if (showAnswer) {
        const isCorrectAnswer = isMcq ? (currentQuestion.answer as string[]).includes(option.id) : currentQuestion.answer === option.id;
        if (isCorrectAnswer) {
          buttonClass = 'bg-green-100 dark:bg-green-800/50 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300';
          indicator = <FaCheckCircle className="text-green-500 dark:text-green-400" />;
        } else if (isSelected) {
          buttonClass = 'bg-red-100 dark:bg-red-800/50 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300';
          indicator = <FaTimesCircle className="text-red-500 dark:text-red-400" />;
        }
      } else if (isSelected) {
        buttonClass = 'bg-blue-100 dark:bg-blue-700/50 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300';
      }
                return (
        <Button key={option.id} variant="outline"
          className={`w-full justify-start p-4 text-left h-auto mb-3 rounded-lg shadow-sm transition-all duration-150 ease-in-out text-base md:text-lg ${buttonClass}`}
          onClick={() => handleAnswerSelect(option.id)} disabled={showAnswer}
        >
          <span className={`font-semibold mr-3 ${isSelected || showAnswer ? '' : 'text-gray-500 dark:text-gray-400'}`}>{optionLetter}.</span>
          <span className="flex-1 break-words whitespace-pre-wrap">{option.content}</span>
          {indicator && <span className="ml-3 text-xl">{indicator}</span>}
        </Button>
      );
    });
  };

  const renderTrueFalseOptions = () => {
    if (!currentQuestion || currentQuestion.type !== QuestionType.TrueFalse) return null;
    const options = [{id: 'true', content: '正确'}, {id: 'false', content: '错误'}];
    const currentSelection = userAnswers[currentQuestion.id];
    return options.map((option) => {
      const isSelected = currentSelection === option.id;
      let buttonClass = 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700';
      let indicator = null;
      if (showAnswer) {
        const isCorrectAnswer = (currentQuestion.answer as string).toLowerCase() === option.id;
        if (isCorrectAnswer) {
          buttonClass = 'bg-green-100 dark:bg-green-800/50 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300';
          indicator = <FaCheckCircle className="text-green-500 dark:text-green-400" />;
        } else if (isSelected) {
          buttonClass = 'bg-red-100 dark:bg-red-800/50 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300';
          indicator = <FaTimesCircle className="text-red-500 dark:text-red-400" />;
        }
      } else if (isSelected) {
        buttonClass = 'bg-blue-100 dark:bg-blue-700/50 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-300';
      }
                return (
        <Button key={option.id} variant="outline"
          className={`w-full justify-start p-4 text-left h-auto mb-3 rounded-lg shadow-sm transition-all duration-150 ease-in-out text-base md:text-lg ${buttonClass}`}
          onClick={() => handleAnswerSelect(option.id)} disabled={showAnswer}
        >
          <span className="flex-1 break-words whitespace-pre-wrap">{option.content}</span>
          {indicator && <span className="ml-3 text-xl">{indicator}</span>}
        </Button>
      );
    });
  };

  const renderShortAnswerInput = () => {
    if (!currentQuestion || currentQuestion.type !== QuestionType.ShortAnswer) return null;
    const currentAnswerText = (userAnswers[currentQuestion.id] as string || '');
    return (
      <div className="mt-4">
        <textarea value={currentAnswerText}
          onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
          placeholder="在此输入您的答案..." rows={4}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-base"
          disabled={showAnswer}
        />
        {showAnswer && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">参考答案:</p>
            <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{currentQuestion.answer as string}</p>
          </div>
        )}
      </div>
    );
  };

  const progressPercentage = practiceQuestions.length > 0 ? ((currentQuestionIndex + 1) / practiceQuestions.length) * 100 : 0;
  const isCurrentCorrect = currentQuestion && showAnswer ? checkIsCorrect(currentQuestion, userAnswers[currentQuestion.id]) : null;
  
  const nextButtonText = isLastQuestion ? '完成练习' : '下一题';
  const nextButtonAction = handleNextQuestion;

  return (
    <div className="dark:bg-gray-900 min-h-screen p-2 sm:p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-2xl animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="text-sm">
                <FaArrowLeft className="mr-2" />返回
              </Button>
              {currentBank && !isReviewMode && (
                <Button variant="outline" size="sm" onClick={handleManageBankClick} className="text-sm">
                  <FaCog className="mr-2" />管理题库
                </Button>
            )}
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isReviewMode ? '错题回顾模式' : '当前题库'}
                </p>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[200px] sm:max-w-xs md:max-w-sm" title={currentBank?.name}>
                  {currentBank?.name ? (isReviewMode ? `${currentBank.name} (错题)`: currentBank.name) : (isReviewMode ? '错题回顾' : '常规练习')}
                </h2>
            </div>
          </div>
          <Progress value={progressPercentage} className="w-full h-2" />
          <div className="flex justify-between items-baseline mt-2">
            <CardTitle className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {isReviewMode ? '回顾: ' : ''} 第 {currentQuestionIndex + 1} / {practiceQuestions.length} 题
            </CardTitle>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {currentQuestion ? QUESTION_TYPE_NAMES[currentQuestion.type] : ''}
            </span>
                </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 py-6 min-h-[300px]">
          {currentQuestion && (
            <>
              <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-100 mb-6 whitespace-pre-wrap leading-relaxed">
                {currentQuestion.content}
              </p>
              {currentQuestion.type === QuestionType.TrueFalse ? renderTrueFalseOptions()
                : currentQuestion.type === QuestionType.ShortAnswer ? renderShortAnswerInput()
                : renderOptions()}
              
              {showAnswer && isReviewMode && (currentQuestion as any).originalUserAnswer && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-700">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">最初错误答案回顾：</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {
                      (() => {
                        const q = currentQuestion as any;
                        const originalAns = q.originalUserAnswer;
                        if (q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) {
                          const currentQOptions = q.options;
                          if (!currentQOptions || currentQOptions.length === 0) return "选项数据缺失";

                          const originalAnswerArray = Array.isArray(originalAns) ? originalAns : [originalAns].filter(Boolean);
                          return originalAnswerArray.map((ansId: string) => {
                            const option = currentQOptions.find((opt: QuestionOption) => opt.id === ansId);
                            if (option) {
                              const optionIndex = currentQOptions.findIndex((opt: QuestionOption) => opt.id === ansId);
                              return `${String.fromCharCode(65 + (optionIndex ?? 0))}. ${option.content}`;
                            }
                            return `未知选项ID: ${ansId}`;
                          }).join(', ') || "未记录";
                        } else if (q.type === QuestionType.TrueFalse) {
                          return originalAns === 'true' ? '正确' : (originalAns === 'false' ? '错误' : (originalAns || "未记录"));
                        } else {
                          return originalAns || "未记录";
                        }
                      })()
                    }
                  </p>
                </div>
              )}
              {showAnswer && currentQuestion.explanation && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow">
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">题目解析:</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {currentQuestion.explanation}
                  </p>
                </div>
                )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6 border-t dark:border-gray-700">
          <Button variant="outline" onClick={handleShowAnswer} 
            disabled={showAnswer || !isCurrentQuestionAnswered}
            className="w-full sm:w-auto text-sm md:text-base disabled:opacity-60">
            <FaLightbulb className="mr-2" /> {showAnswer ? (isCurrentCorrect ? '回答正确' : '回答错误') : '查看答案'}
          </Button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => { 
                setShowAnswer(false); 
                setCurrentQuestionIndex(prev => Math.max(0, prev -1));
              }} 
              disabled={currentQuestionIndex === 0}
              className="flex-1 sm:flex-initial text-sm md:text-base disabled:opacity-60">
              <FaArrowLeft className="mr-1 sm:mr-2" /> 上一题
            </Button>
            <Button onClick={nextButtonAction} 
              disabled={!canPressNext}
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm md:text-base disabled:opacity-60">
              {nextButtonText} <FaArrowRight className="ml-1 sm:ml-2" />
            </Button>
        </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <BeatLoader color={useThemeStore.getState().theme === 'dark' ? '#38BDF8' : '#3B82F6'} />
        <p className="text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
