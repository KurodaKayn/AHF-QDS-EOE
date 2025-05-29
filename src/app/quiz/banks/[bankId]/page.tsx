'use client';
import { useParams, useRouter } from 'next/navigation';//动态路由参数
import { useState, useEffect } from 'react';//页面导航
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionType, QuestionOption } from '@/types/quiz';
import { FaPlus, FaTrash, FaEdit, FaChevronLeft, FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaSave, FaArrowLeft } from 'react-icons/fa';
import { QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 题库详情页面，用于管理特定题库中的题目
 */
export default function BankDetailPage() {
  const router = useRouter();
  const params = useParams();
  // 确保 bankId 总是字符串
  const bankId = Array.isArray(params.bankId) 
    ? params.bankId[0] || '' 
    : params.bankId || '';
  
  const { getQuestionBankById, updateQuestionInBank, deleteQuestionFromBank, addQuestionToBank } = useQuizStore();
  
  const bank = getQuestionBankById(bankId);
  //分别控制编辑和添加题目的弹窗
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);// 控制编辑题目模态框的显示/隐藏状态
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);//存储当前正在编辑的题目对象
  const [searchTerm, setSearchTerm] = useState('');//用于题目搜索功能
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');// 题目类型过滤状态
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 默认按更新时间降序
  
  // 管理题目编辑状态
  const [questionContent, setQuestionContent] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SingleChoice);//题目类型状态
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [questionAnswer, setQuestionAnswer] = useState<string | string[]>('');
  const [questionExplanation, setQuestionExplanation] = useState('');
  
  // 添加题目模态框
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 如果题库不存在，显示错误页
  if (!bank) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-red-500 dark:text-red-400 mb-4">题库不存在</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          您请求的题库未找到，可能已被删除或 ID 无效。
        </p>
        <button
          onClick={() => router.push('/quiz')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center"
        >
          <FaArrowLeft className="mr-2" /> 返回题库列表
        </button>
      </div>
    );
  }
  
  const handleOpenEditModal = (question: Question) => {
    setEditingQuestion(question);
    setQuestionContent(question.content);
    setQuestionType(question.type);
    setQuestionOptions(question.options ? [...question.options] : []);
    
    // 处理答案 - 转换字母答案为选项ID
    if (question.type === QuestionType.SingleChoice && typeof question.answer === 'string') {
      //单选题处理
      const answerLetter = question.answer.toUpperCase();
      if (answerLetter.length === 1 && answerLetter >= 'A' && answerLetter <= 'Z') {
        const index = answerLetter.charCodeAt(0) - 65; // 'A'的ASCII码是65，得0为a
        if (question.options && index < question.options.length) {
          setQuestionAnswer(question.options[index].id);
        } else {
          setQuestionAnswer(question.answer);
        }
      } else {
        setQuestionAnswer(question.answer);
      }
    } 
    // 多选题答案处理
    else if (question.type === QuestionType.MultipleChoice && Array.isArray(question.answer)) {
      // 如果多选题的答案包含字母，则转换为对应的选项ID
      const convertedAnswers: string[] = [];
      
      question.answer.forEach(ans => {
        if (typeof ans === 'string' && ans.length === 1 && ans.toUpperCase() >= 'A' && ans.toUpperCase() <= 'Z') {
          const index = ans.toUpperCase().charCodeAt(0) - 65;
          if (question.options && index < question.options.length) {
            convertedAnswers.push(question.options[index].id);
          } else {
            convertedAnswers.push(ans);
          }
        } else {
          convertedAnswers.push(ans as string);
        }
      });
      
      setQuestionAnswer(convertedAnswers);
    } else {
      // 其他情况直接设置
      setQuestionAnswer(question.answer);
    }
    
    setQuestionExplanation(question.explanation || '');
    setIsEditModalOpen(true);
  };
  //题目编辑和状态管理逻辑
  const handleOpenAddModal = () => {
    // 重置所有题目相关状态,使用crypto.randomUUID()生成唯一选项ID
    setEditingQuestion(null);
    setQuestionContent('');
    setQuestionType(QuestionType.SingleChoice);
    setQuestionOptions([
      { id: crypto.randomUUID(), content: '' },
      { id: crypto.randomUUID(), content: '' },
      { id: crypto.randomUUID(), content: '' },
      { id: crypto.randomUUID(), content: '' }
    ]);
    setQuestionAnswer('');
    setQuestionExplanation('');
    setIsAddModalOpen(true);
  };
  //关闭所有模态框
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
    setEditingQuestion(null);
  };
  //添加新选项
  const handleAddOption = () => {
    setQuestionOptions([...questionOptions, { id: crypto.randomUUID(), content: '' }]);
  };
  //删除选项
  const handleRemoveOption = (id: string) => {
    setQuestionOptions(questionOptions.filter(opt => opt.id !== id));
    
    // 如果删除的选项是当前答案，清空答案
    if (questionType === QuestionType.SingleChoice && questionAnswer === id) {
      setQuestionAnswer('');
    } else if (questionType === QuestionType.MultipleChoice && Array.isArray(questionAnswer)) {
      setQuestionAnswer(questionAnswer.filter(ans => ans !== id));
    }
  };
  //修改选项内容
  const handleOptionChange = (id: string, content: string) => {
    setQuestionOptions(
      questionOptions.map(opt => 
        opt.id === id ? { ...opt, content } : opt
      )
    );
  };
  //处理答案选择
  const handleAnswerChange = (id: string) => {
    if (questionType === QuestionType.SingleChoice) {
      setQuestionAnswer(id);
    } else if (questionType === QuestionType.MultipleChoice) {
      const currentAnswers = Array.isArray(questionAnswer) ? questionAnswer : [];
      if (currentAnswers.includes(id)) {
        setQuestionAnswer(currentAnswers.filter(a => a !== id));
      } else {
        setQuestionAnswer([...currentAnswers, id]);
      }
    }
  };
  //题目类型切换
  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    
    // 根据题型重置答案
    if (type === QuestionType.SingleChoice) {
      setQuestionAnswer('');
    } else if (type === QuestionType.MultipleChoice) {
      setQuestionAnswer([]);
    } else if (type === QuestionType.TrueFalse) {
      setQuestionOptions([
        { id: crypto.randomUUID(), content: '正确' },
        { id: crypto.randomUUID(), content: '错误' }
      ]);
      setQuestionAnswer('');
    } else if (type === QuestionType.ShortAnswer) {
      setQuestionOptions([]);
      setQuestionAnswer('');
    } else if (type === QuestionType.FillInBlank) {
      setQuestionOptions([]);
      setQuestionAnswer('');
    }
  };
  //题目保存
  const handleSaveQuestion = () => {
    // 验证表单
    if (!questionContent.trim()) {
      alert('题目内容不能为空');
      return;
    }
    
    if ((questionType === QuestionType.SingleChoice || questionType === QuestionType.MultipleChoice) 
        && questionOptions.length < 2) {
      alert('选择题至少需要两个选项'); 
      return;
    }
    
    if ((questionType === QuestionType.SingleChoice && !questionAnswer) ||
        (questionType === QuestionType.MultipleChoice && 
         (!Array.isArray(questionAnswer) || questionAnswer.length === 0))) {
      alert('请选择正确答案');
      return;
    }
    
    // 标准化答案格式，始终使用选项ID而不是字母
    let finalAnswer = questionAnswer;
    
    // 创建新题目对象
    const updatedQuestion: Omit<Question, 'id'> = {
      content: questionContent,
      type: questionType,
      options: (questionType === QuestionType.ShortAnswer) ? [] : questionOptions,
      answer: finalAnswer,
      explanation: questionExplanation,
      tags: editingQuestion?.tags || [],
      createdAt: editingQuestion?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    
    if (isEditModalOpen && editingQuestion) {
      updateQuestionInBank(bankId, editingQuestion.id, updatedQuestion);
    } else {
      addQuestionToBank(bankId, updatedQuestion);
    }
    
    handleCloseModal();
  };
  //题目删除处理
  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('确定要删除这个题目吗？此操作无法撤销。')) {
      deleteQuestionFromBank(bankId, questionId);
    }
  };
  
  // 过滤和排序题目
  const filteredQuestions = bank.questions.filter(q => {
      // 先按照题目类型筛选
      if (filterType !== 'all' && q.type !== filterType) {
        return false;
      }
      
      // 再按照搜索条件筛选
      if (!searchTerm) return true;
      
      // 搜索题目内容、选项和解析
      const searchLower = searchTerm.toLowerCase();
      return (
        q.content.toLowerCase().includes(searchLower) ||
        (q.explanation?.toLowerCase() || '').includes(searchLower) ||
        (q.options || []).some(opt => opt.content.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      // 按照更新时间排序
      if (sortOrder === 'asc') {
        return a.updatedAt - b.updatedAt;
      } else {
        return b.updatedAt - a.updatedAt;
      }
    });
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      {/* 返回按钮和页面标题 */}
      <header className="mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
            <div>
              <button
                onClick={() => router.push('/quiz')}
                className="mb-4 flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <FaChevronLeft className="mr-1" /> 返回题库列表
              </button>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {bank.name}
              </h1>
              {bank.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {bank.description}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                共 {bank.questions.length} 道题目 · 
                更新于 {formatDistanceToNow(new Date(bank.updatedAt), { 
                  addSuffix: true, 
                  locale: zhCN 
                })}
              </p>
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
            >
              <FaPlus className="mr-2" /> 添加新题目
            </button>
          </div>
        </div>
      </header>
      
      {/* 过滤和搜索栏 */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索题目内容、选项或解析..."
                className="pl-10 w-full py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* 题型过滤 */}
            <div className="flex items-center">
              <div className="mr-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                <FaFilter className="inline mr-1" /> 题型:
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as QuestionType | 'all')}
                className="form-select border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">全部题型</option>
                {Object.entries(QUESTION_TYPE_NAMES).map(([type, name]) => (
                  <option key={type} value={type}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 排序方式 */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {sortOrder === 'asc' ? (
                <>
                  <FaSortAmountUp className="mr-2" /> 时间升序
                </>
              ) : (
                <>
                  <FaSortAmountDown className="mr-2" /> 时间降序
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* 题目列表 */}
      <div className="max-w-6xl mx-auto">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterType !== 'all' ? 
                '没有符合条件的题目。尝试调整搜索条件或过滤器。' : 
                '此题库中暂无题目。点击上方的"添加新题目"按钮开始创建。'}
            </p>
            {(searchTerm || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                清除过滤条件
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div 
                key={question.id} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                      {QUESTION_TYPE_NAMES[question.type]}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(question)}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1"
                        title="编辑题目"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 p-1"
                        title="删除题目"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3 text-gray-800 dark:text-white">
                    {question.content}
                  </div>
                  
                  {(question.type === QuestionType.SingleChoice || 
                    question.type === QuestionType.MultipleChoice) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                      {(question.options || []).map((option, index) => {
                        // 获取选项字母
                        const optionLetter = String.fromCharCode(65 + index);
                        
                        // 判断是否为正确答案 - 同时处理选项ID和选项字母(A,B,C,D)作为答案的情况
                        let isCorrect = false;
                        
                        if (question.type === QuestionType.SingleChoice) {
                          // 单选题 - 如果答案是ID直接比较，如果答案是字母则转换为对应索引的选项ID
                          isCorrect = 
                            question.answer === option.id || 
                            (typeof question.answer === 'string' && 
                             question.answer.toUpperCase() === optionLetter);
                        } else if (question.type === QuestionType.MultipleChoice) {
                          // 多选题 - 处理答案是ID数组或字母数组的情况
                          if (Array.isArray(question.answer)) {
                            isCorrect = 
                              question.answer.includes(option.id) || 
                              question.answer.some(ans => 
                                typeof ans === 'string' && ans.toUpperCase() === optionLetter
                              );
                          }
                        }
                        
                        return (
                          <div
                            key={option.id}
                            className={`px-3 py-2 border rounded-md text-sm flex items-center ${
                              isCorrect
                                ? 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600 text-green-800 dark:text-green-100 font-semibold shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${
                              isCorrect 
                                ? 'bg-green-500 text-white font-bold'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {optionLetter}
                            </span>
                            <span className="flex-grow">{option.content}</span>
                            {isCorrect && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 dark:text-green-300 ml-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {question.type === QuestionType.TrueFalse && (
                    <div className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                      答案: <span className="font-medium text-green-600 dark:text-green-400">
                        {question.answer === 'true' ? '正确' : '错误'}
                      </span>
                    </div>
                  )}
                  
                  {question.type === QuestionType.ShortAnswer && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-800 dark:text-white">参考答案:</span> {question.answer as string}
                    </div>
                  )}
                  
                  {question.type === QuestionType.FillInBlank && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-800 dark:text-white">填空答案:</span> {
                        Array.isArray(question.answer) 
                          ? question.answer.join(' / ')
                          : question.answer as string
                      }
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">解析:</span> {question.explanation}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                    更新于 {formatDistanceToNow(new Date(question.updatedAt), { 
                      addSuffix: true, 
                      locale: zhCN 
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 编辑题目模态框 */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto max-h-screen">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              {isEditModalOpen ? '编辑题目' : '添加新题目'}
            </h3>
            
            <div className="space-y-5">
              {/* 题目类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  题目类型
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(QUESTION_TYPE_NAMES).map(([typeValue, name]) => (
                    <button
                      key={typeValue}
                      onClick={() => handleTypeChange(typeValue as QuestionType)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        typeValue === questionType
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 题目内容 */}
              <div>
                <label htmlFor="questionContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  题目内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="questionContent"
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="请输入题目内容..."
                />
              </div>
              
              {/* 选择题选项 */}
              {(questionType === QuestionType.SingleChoice || 
                questionType === QuestionType.MultipleChoice ||
                questionType === QuestionType.TrueFalse) && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      选项 <span className="text-red-500">*</span>
                    </label>
                    {(questionType === QuestionType.SingleChoice || 
                      questionType === QuestionType.MultipleChoice) && (
                      <button
                        onClick={handleAddOption}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                        type="button"
                      >
                        <FaPlus size={12} className="mr-1" /> 添加选项
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {questionOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <div className="flex-none">
                          <input
                            type={questionType === QuestionType.SingleChoice ? "radio" : "checkbox"}
                            checked={
                              questionType === QuestionType.SingleChoice 
                                ? questionAnswer === option.id
                                : Array.isArray(questionAnswer) && questionAnswer.includes(option.id)
                            }
                            onChange={() => handleAnswerChange(option.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </div>
                        <div className="flex-grow">
                          <input
                            type="text"
                            value={option.content}
                            onChange={(e) => handleOptionChange(option.id, e.target.value)}
                            placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        {(questionType !== QuestionType.TrueFalse) && (
                          <button
                            onClick={() => handleRemoveOption(option.id)}
                            disabled={questionOptions.length <= 2}
                            className={`p-1 rounded-full ${
                              questionOptions.length <= 2
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                            }`}
                            title={questionOptions.length <= 2 ? "至少需要两个选项" : "删除此选项"}
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 简答题答案 */}
              {questionType === QuestionType.ShortAnswer && (
                <div>
                  <label htmlFor="shortAnswer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    参考答案 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="shortAnswer"
                    value={questionAnswer as string}
                    onChange={(e) => setQuestionAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="请输入参考答案..."
                  />
                </div>
              )}
              
              {/* 填空题答案 */}
              {questionType === QuestionType.FillInBlank && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      填空答案 <span className="text-red-500">*</span>
                    </label>
                    <button
                      onClick={() => {
                        const currentAnswers = Array.isArray(questionAnswer) ? questionAnswer : questionAnswer ? [questionAnswer as string] : [];
                        setQuestionAnswer([...currentAnswers, '']);
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                      type="button"
                    >
                      <FaPlus size={12} className="mr-1" /> 添加答案
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {Array.isArray(questionAnswer) 
                      ? questionAnswer.map((answer, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="flex-grow">
                              <input
                                type="text"
                                value={answer}
                                onChange={(e) => {
                                  const newAnswers = [...questionAnswer] as string[];
                                  newAnswers[index] = e.target.value;
                                  setQuestionAnswer(newAnswers);
                                }}
                                placeholder={`答案 ${index + 1}`}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const newAnswers = [...questionAnswer] as string[];
                                newAnswers.splice(index, 1);
                                setQuestionAnswer(newAnswers.length > 0 ? newAnswers : '');
                              }}
                              className="p-1 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              title="删除此答案"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        ))
                      : (
                          <input
                            type="text"
                            value={questionAnswer as string}
                            onChange={(e) => setQuestionAnswer(e.target.value)}
                            placeholder="填空答案"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        )
                    }
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    提示: 可添加多个可接受的答案。当有多个空需要填写时，请按顺序添加答案。
                  </p>
                </div>
              )}
              
              {/* 题目解析 */}
              <div>
                <label htmlFor="questionExplanation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  解析 (可选)
                </label>
                <textarea
                  id="questionExplanation"
                  value={questionExplanation}
                  onChange={(e) => setQuestionExplanation(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="请输入题目解析..."
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center"
              >
                <FaSave className="mr-2" /> {isEditModalOpen ? '保存更改' : '添加题目'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 