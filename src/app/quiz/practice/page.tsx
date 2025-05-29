'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaLightbulb, FaCheckCircle, FaTimesCircle, FaRedo, FaCog } from 'react-icons/fa';
import { useQuizStore } from '@/hooks/useQuizStore';
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

  // 状态管理
  const [currentBank, setCurrentBank] = useState<QuestionBank | null>(null); // 当前练习的题库
  const [allBankQuestions, setAllBankQuestions] = useState<Question[]>([]); // 题库中的所有题目
  const [practiceQuestions, setPracticeQuestions] = useState<(Question & { originalUserAnswer?: string | string[] })[]>([]); // 当前练习的题目集合
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 当前题目索引
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({}); // 用户的答案，键为题目ID
  const [showAnswer, setShowAnswer] = useState(false); // 是否显示答案
  const [quizCompleted, setQuizCompleted] = useState(false); // 练习是否完成
  const [startTime, setStartTime] = useState<number | null>(null); // 开始时间戳
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 总用时（秒）
  const [isLoading, setIsLoading] = useState(true); // 是否正在加载
  const [isNumQuestionsModalOpen, setIsNumQuestionsModalOpen] = useState(false); // 是否显示题目数量选择对话框

  // 当前正在练习的题目
  const currentQuestion = practiceQuestions[currentQuestionIndex];
  
  /**
   * 判断当前题目是否已经作答
   * 对于单选题和判断题，检查是否有非空字符串答案
   * 对于多选题，检查是否有至少一个选项被选中
   */
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion || !userAnswers[currentQuestion.id]) return false;
    const answer = userAnswers[currentQuestion.id];
    return Array.isArray(answer) ? answer.length > 0 : answer !== '';
  }, [currentQuestion, userAnswers]);

  /**
   * 判断是否为最后一题
   * 用于决定"下一题"按钮的行为（是否显示完成按钮）
   */
  const isLastQuestion = useMemo(() => 
    currentQuestionIndex === practiceQuestions.length - 1 && practiceQuestions.length > 0
  , [currentQuestionIndex, practiceQuestions.length]);

  /**
   * 判断是否可以点击下一题按钮
   * - 如果是最后一题，必须回答后才能完成
   * - 如果不是最后一题，可以在回答后或显示答案后前进
   */
  const canPressNext = useMemo(() => {
    if (isLastQuestion) {
      return isCurrentQuestionAnswered;
    } else {
      return isCurrentQuestionAnswered || showAnswer;
    }
  }, [isLastQuestion, isCurrentQuestionAnswered, showAnswer]);

  /**
   * 页面加载和参数变化时的副作用
   * 处理题库加载、题目筛选、错题加载等逻辑
   */
  useEffect(() => {
    if (!bankId) {
      router.push('/quiz');
      return;
    }

    const bank = getQuestionBankById(bankId);
    if (bank) {
      setCurrentBank(bank);
      
      if (isReviewMode) {
        // 错题复习模式初始化
        /**
         * 错题复习模式的初始化流程
         * 
         * 该代码块实现了错题复习功能的核心逻辑：
         * 1. 从全局错题记录中筛选并加载当前题库的错题
         * 2. 准备错题练习环境
         * 3. 应用相关设置（随机排序等）
         * 
         * 详细流程：
         * 1. 首先检查是否已完成练习，避免重新初始化已完成的练习
         * 2. 筛选错误记录（records中isCorrect为false的记录）
         * 3. 找出当前题库中与错误记录匹配的题目
         * 4. 为错题添加originalUserAnswer字段，保存最初的错误答案
         * 5. 如果没有错题，则导航回错题本页面
         * 6. 根据设置决定是否随机排序错题和选项
         * 7. 初始化练习状态（重置用户答案、当前题目索引等）
         * 
         * 特殊处理：
         * - 记录原始错误答案：通过添加originalUserAnswer字段，让用户在复习时
         *   能够看到自己最初的错误答案，有助于理解和改正
         * - 状态重置：确保每次进入错题复习模式时都是新的练习环境
         * - 空错题检查：当没有错题时自动返回错题本页面
         */
        // 如果练习已完成，则不应在 useEffect 中自动重新开始
        // 允许总结页面显示，直到用户明确操作
        if (quizCompleted) {
            setIsLoading(false); // 确保 loading 状态解除
            return; 
        }

        // 筛选当前题库中的错题
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
          // 如果在进入错题练习时（非完成时）就发现没有错题，则导航回错题本
          // 这个判断主要是针对初次加载或 bankId/mode 变化时
          router.push('/quiz/review');
          return;
        }
        
        // 设置所有错题
        setAllBankQuestions(wrongQuestionsFromBank);
        let questionsToSet = [...wrongQuestionsFromBank];
        
        // 根据设置决定是否打乱错题顺序
        if (settings.shuffleReviewQuestionOrder) {
          questionsToSet = shuffleArray([...questionsToSet]);
        }
        
        // 根据设置决定是否打乱选项顺序（单选题和多选题）
        if (settings.shuffleReviewOptions) {
          questionsToSet = questionsToSet.map(q_item => {
            if (q_item.options && q_item.type !== QuestionType.TrueFalse && q_item.options.length > 1) {
              const shuffledOptions = shuffleArray([...q_item.options]);
              return { ...q_item, options: shuffledOptions };
            }
            return q_item;
          });
        }
        
        // 初始化练习
        setPracticeQuestions(questionsToSet);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowAnswer(false);
        setQuizCompleted(false); // 明确重置，确保开始新练习时不是完成状态
        setStartTime(Date.now());
        setIsLoading(false);
      } else {
        // 普通练习模式
        const loadedQuestions = bank.questions.map(q => ({...q, options: q.options ? [...q.options] : []}));
        setAllBankQuestions(loadedQuestions);
        if (practiceQuestions.length === 0 && loadedQuestions.length > 0 && !quizCompleted) { 
          // 首次加载或重新开始练习时，打开题目数量选择对话框
          setIsNumQuestionsModalOpen(true);
        }
        setIsLoading(false);
      }
    } else {
      router.push('/quiz');
    }
  }, [bankId, getQuestionBankById, isReviewMode, records, router, settings.shuffleReviewOptions, settings.shuffleReviewQuestionOrder, settings.markMistakeAsCorrectedOnReviewSuccess, quizCompleted]);

  /**
   * 自动继续功能的副作用
   * 当启用自动继续设置时，自动显示答案并进入下一题
   */
  useEffect(() => {
    // 检查是否已经回答了当前问题
    if (isCurrentQuestionAnswered && !showAnswer && (settings as any).autoContinue) {
      // 自动显示答案
      const timer = setTimeout(() => {
        handleShowAnswer();
        
        // 如果不是最后一题，设置一个延迟后自动前进到下一题
        if (!isLastQuestion) {
          const nextTimer = setTimeout(() => {
            handleNextQuestion();
          }, 1500); // 1.5秒后自动进入下一题
          
          return () => clearTimeout(nextTimer);
        }
      }, 800); // 0.8秒后显示答案
      
      return () => clearTimeout(timer);
    }
  }, [isCurrentQuestionAnswered, showAnswer, settings, isLastQuestion]);

  /**
   * 处理题目数量选择
   * 根据用户选择的题目数量，初始化练习
   * 
   * @param {number} numToPractice - 用户选择的题目数量
   */
  const handleNumQuestionsSubmit = (numToPractice: number) => {
    setIsNumQuestionsModalOpen(false);
    let questionsToSet = [...allBankQuestions];
    
    // 应用题目随机排序设置
    if (settings.shufflePracticeQuestionOrder) {
      questionsToSet = shuffleArray([...questionsToSet]); // 使用更可靠的 shuffleArray 函数
    }
    
    // 限制题目数量
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
    
    // 初始化练习
    setPracticeQuestions(questionsToSet);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setQuizCompleted(false);
    setStartTime(Date.now());
  };
  
  /**
   * 处理用户答案选择操作
   * 
   * 该函数负责处理用户在答题过程中选择/取消选择选项的逻辑，支持多种题型：
   * 1. 单选题：直接设置所选选项ID为答案
   * 2. 多选题：动态管理选项集合（选中则添加，再次点击则移除）
   * 3. 判断题：与单选题处理逻辑相同，设置'true'或'false'为答案
   * 
   * 工作流程：
   * 1. 验证前置条件（当前有题目且答案未显示）
   * 2. 根据题目类型执行不同的答案处理逻辑：
   *    - 多选题：检查选项是否已被选中，若已选中则移除，否则添加到选中集合
   *    - 单选题/判断题：直接将选项ID设置为答案
   * 3. 更新全局用户答案状态，使用不可变更新模式
   * 
   * 注意：
   * - 当已显示正确答案时，此函数不会执行任何操作
   * - 用户答案存储在userAnswers状态对象中，以题目ID为键
   * - 多选题答案以字符串数组形式存储，单选题和判断题以字符串形式存储
   * 
   * @param {string} optionId - 用户选择/取消选择的选项ID
   */
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
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer
    }));
  };

  const handleShowAnswer = () => {
    if (!currentQuestion) return;
    setShowAnswer(true);
  };
  
  /**
   * 检查用户答案是否正确
   * 
   * 该函数是错题判定的核心，负责根据不同题型比较用户答案和正确答案：
   * 
   * 支持的题目类型：
   * 1. 多选题 (MultipleChoice)：
   *    - 比较两个答案集合是否完全相同（不考虑顺序）
   *    - 用户必须选择全部且仅选择全部正确选项才算正确
   * 
   * 2. 判断题 (TrueFalse)：
   *    - 字符串比较（忽略大小写）
   *    - 正确答案通常为"true"或"false"
   * 
   * 3. 填空题 (FillInBlank)：
   *    - 支持多个可接受答案（用分号分隔）
   *    - 用户答案与任一标准答案匹配即为正确
   *    - 比较时忽略大小写，但必须完全匹配（不支持模糊匹配）
   * 
   * 4. 其他类型题目（如单选题、简答题）：
   *    - 字符串比较（忽略大小写）
   * 
   * 该函数在多处使用：
   * - 显示答案时判定正确/错误状态
   * - 完成练习时决定是否记录错题
   * - 练习总结页显示正确率统计
   * 
   * @param {Question} question - 当前题目对象
   * @param {string | string[] | undefined} userAnswer - 用户答案
   * @returns {boolean} 返回答案是否正确
   */
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
    } else if (question.type === QuestionType.FillInBlank) {
      // 处理填空题的多答案情况
      const userAns = (userAnswer as string).trim();
      if (!userAns) return false; // 用户未作答

      // 处理标准答案
      const correctAns = question.answer as string;
      
      // 处理可能的多个标准答案（用分号分隔）
      if (correctAns.includes(';')) {
        // 正则表达式匹配分号，但不匹配连续分号中的前面那个
        const acceptableAnswers = correctAns.split(/;(?!;)/).map(ans => {
          // 替换连续分号为单个分号
          return ans.replace(/;;/g, ';').trim();
        });
        
        // 只要用户答案匹配任何一个可接受的答案即为正确（忽略大小写）
        return acceptableAnswers.some(acceptableAns => 
          userAns.toLowerCase() === acceptableAns.toLowerCase()
        );
      }
      
      // 单个答案的情况
      return userAns.toLowerCase() === correctAns.toLowerCase();
    }
    
    // 其他类型题目
    return (userAnswer as string).toLowerCase() === (question.answer as string).toLowerCase();
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

  /**
   * 处理练习完成的逻辑
   * 
   * 该函数在用户完成整个练习后执行，负责：
   * 1. 批量处理所有题目的答题记录
   * 2. 实现错题管理的核心逻辑
   * 3. 设置练习完成状态和计算用时
   * 
   * 错题管理流程：
   * 1. 对每个题目，首先检查答案是否正确
   * 2. 通过removeWrongRecordsByQuestionId移除该题目的所有旧错误记录
   *    (这确保了记录的一致性，防止重复记录)
   * 3. 对于回答错误的题目：
   *    - 添加一条isCorrect=false的记录到records
   *    - 这条记录会使题目被标记为错题并出现在错题本中
   * 4. 对于回答正确的题目：
   *    - 在复习模式且开启了"复习成功自动纠正"设置时：
   *      添加一条isCorrect=true的记录
   *    - 不添加任何记录（普通模式或未开启设置）
   * 
   * 实现细节：
   * - 采用批量处理而非即时记录，减少状态更新和网络请求
   * - 先清除后添加的模式确保了记录的准确性
   * - 通过addRecord和removeWrongRecordsByQuestionId函数间接操作zustand store
   * - 这些操作通过store的persist中间件自动保存到localStorage
   */
  const handleCompleteQuiz = () => {
    practiceQuestions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = checkIsCorrect(question, userAnswer);

      removeWrongRecordsByQuestionId(question.id);
      // 如果用户答错了，记录错误答案
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
                    } else if (question.type === QuestionType.FillInBlank && (question.answer as string).includes(';')) {
                        // 处理填空题多答案显示，将答案拆分并美化显示
                        const correctAns = question.answer as string;
                        // 正则表达式匹配分号，但不匹配连续分号中的前面那个
                        const acceptableAnswers = correctAns.split(/;(?!;)/).map(ans => {
                            // 替换连续分号为单个分号
                            return ans.replace(/;;/g, ';').trim();
                        });
                        correctAnswerDisplay = acceptableAnswers.map((ans, i) => `答案${i+1}: ${ans}`).join(' | ');
                    } else { // Short Answer, other FillInBlank
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
                  // 题库为空，页面将基于practiceQuestions.length === 0显示空状态
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

  // 填空题输入组件
  const renderFillInBlankInput = () => {
    if (!currentQuestion || currentQuestion.type !== QuestionType.FillInBlank) return null;
    const currentAnswerText = (userAnswers[currentQuestion.id] as string || '');
    
    return (
      <div className="mt-4">
        <input 
          type="text" 
          value={currentAnswerText}
          onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
          placeholder="在此输入填空答案..." 
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-base"
          disabled={showAnswer}
        />
        {showAnswer && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">参考答案:</p>
            {(currentQuestion.answer as string).includes(';') ? (
              <div>
                {(currentQuestion.answer as string).split(/;(?!;)/).map((ans, i) => (
                  <p key={i} className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                    {i + 1}. {ans.replace(/;;/g, ';').trim()}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{currentQuestion.answer as string}</p>
            )}
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
                : currentQuestion.type === QuestionType.FillInBlank ? renderFillInBlankInput()
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
            disabled={showAnswer}
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
