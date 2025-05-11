'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionBank, QuestionType, QuestionOption } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FaPlusCircle, FaEdit, FaTrash, FaArrowLeft, FaEye, FaRegTrashAlt, FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';
import { QUESTION_TYPE_NAMES } from '@/constants/quiz';
import QuestionFormModal from '@/components/QuestionFormModal';
import { BeatLoader } from 'react-spinners';
import { useThemeStore } from '@/store/themeStore';

// 创建静态导出路径的辅助组件
const ManageIndexPage = () => {
  // 这个组件的作用是确保静态构建时能生成这个路径
  return (
    <div className="hidden">
      <h1>题库管理页面</h1>
      <p>如果看到这个页面，说明页面加载中或发生了错误。</p>
    </div>
  );
};

// 客户端组件，使用 useSearchParams()，但通过父组件提供的 URLSearchParams
function ManageBanksPageContent({ initialTempBankId }: { initialTempBankId: string | null }) {
  const router = useRouter();
  const {
    questionBanks,
    getQuestionBankById,
    addQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    deleteQuestionFromBank,
  } = useQuizStore();

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  
  const [editBankName, setEditBankName] = useState('');
  const [editBankDescription, setEditBankDescription] = useState('');

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedBanks = useMemo(() => {
    return [...(questionBanks || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [questionBanks]);

  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return getQuestionBankById(selectedBankId) || null;
  }, [selectedBankId, getQuestionBankById, questionBanks]);

  const filteredQuestions = useMemo(() => {
    if (!selectedBank?.questions) return [];
    if (!searchQuery.trim()) return selectedBank.questions;
    
    return selectedBank.questions.filter(question => 
      question.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedBank, searchQuery]);

  // 初始化时处理可能的URL参数 - 这里改为通过props接收
  useEffect(() => {
    try {
      if (initialTempBankId && questionBanks && questionBanks.some(bank => bank.id === initialTempBankId)) {
        setSelectedBankId(initialTempBankId);
        // 由于是静态导出，我们不再尝试修改URL
      }
    } catch (error) {
      console.error("处理题库ID出错:", error);
    }
  }, [initialTempBankId, questionBanks]);

  useEffect(() => {
    if (selectedBank) {
      setEditBankName(selectedBank.name);
      setEditBankDescription(selectedBank.description || '');
      setIsEditingBankDetails(false);
    } else {
      setEditBankName('');
      setEditBankDescription('');
      setIsEditingBankDetails(false);
      if (selectedBankId && !(questionBanks || []).find(b => b.id === selectedBankId)) {
        setSelectedBankId(null);
      }
    }
  }, [selectedBank, selectedBankId, questionBanks]);

  const handleSelectBank = (bankId: string) => {
    if (bankId === '__new__') {
      setSelectedBankId(null);
    } else {
      setSelectedBankId(bankId);
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
    }
  };

  const handleSaveBankDetails = () => {
    if (!selectedBank || !editBankName.trim()) {
      toast.error('题库名称不能为空。');
      return;
    }
    updateQuestionBank(
      selectedBank.id, 
      editBankName.trim(), 
      editBankDescription.trim()
    );
    toast.success(`题库 "${editBankName.trim()}" 信息已更新。`);
    setIsEditingBankDetails(false);
  };
  
  const handleCreateNewBank = () => {
    const newName = prompt('请输入新题库的名称:');
    if (newName && newName.trim()) {
      const newBank = addQuestionBank(newName.trim(), '');
      if (newBank && typeof newBank === 'object' && 'id' in newBank) {
        setSelectedBankId(newBank.id);
        toast.success(`新题库 "${newName.trim()}" 已创建并选中。`);
      } else if (newBank && typeof newBank === 'string') {
        setSelectedBankId(newBank);
        toast.success(`新题库 "${newName.trim()}" 已创建并选中。`);
      } else {
         toast.success(`新题库 "${newName.trim()}" 已创建。`);
      }
    } else if (newName !== null) {
      toast.error('题库名称不能为空。');
    }
  };

  const handleDeleteCurrentBank = () => {
    if (!selectedBank) return;
    if (confirm(`确定要永久删除题库 "${selectedBank.name}" 吗？\n此操作无法撤销，题库下的所有题目也将被删除。`)) {
      deleteQuestionBank(selectedBank.id);
      toast.success(`题库 "${selectedBank.name}" 已被删除。`);
      setSelectedBankId(null);
    }
  };

  const handleDeleteQuestion = (questionId: string, questionContent: string) => {
    if (!selectedBank) return;
    if (confirm(`确定要删除题目 "${questionContent.substring(0, 50)}${questionContent.length > 50 ? '...' : ''}" 吗？\n此操作无法撤销。`)) {
      deleteQuestionFromBank(selectedBank.id, questionId);
      toast.success(`题目已删除。`);
    }
  };

  const handleOpenAddQuestionModal = () => {
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestionModal = (question: Question) => {
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleQuestionModalClose = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  if (questionBanks === undefined) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex justify-center items-center dark:bg-gray-900">
        <p className="text-xl text-gray-500 dark:text-gray-400">加载题库列表中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen dark:bg-gray-900">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">题库管理</CardTitle>
            <Button variant="outline" onClick={() => router.push('/quiz')} size="sm">
              <FaArrowLeft className="mr-2" />返回题库列表
            </Button>
          </div>
          <CardDescription className="dark:text-gray-400">选择一个题库进行编辑，或创建一个新题库。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-grow w-full sm:w-auto">
            <Select onValueChange={handleSelectBank} value={selectedBankId || ''}>
              <SelectTrigger className="w-full min-w-[250px] text-base py-2.5">
                <SelectValue placeholder="请选择一个题库..." />
              </SelectTrigger>
              <SelectContent>
                {sortedBanks.length === 0 && (
                  <SelectItem value="__disabled__" disabled>暂无题库，请先创建</SelectItem>
                )}
                {sortedBanks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id} className="text-base py-2">
                    {bank.name} ({bank.questions ? bank.questions.length : 0}题)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateNewBank} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
            <FaPlusCircle className="mr-2" /> 创建新题库
          </Button>
        </CardContent>
      </Card>

      {selectedBank && (
        <Card className="animate-fade-in shadow-lg">
          <CardHeader className="border-b dark:border-gray-700 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl text-blue-700 dark:text-blue-400">题库: {selectedBank.name}</CardTitle>
              <div className="flex gap-2">
                {!isEditingBankDetails && (
                    <Button variant="outline" onClick={() => setIsEditingBankDetails(true)} size="sm">
                    <FaEdit className="mr-2" /> 编辑信息
                    </Button>
                )}
                <Button variant="destructive" onClick={handleDeleteCurrentBank} size="sm">
                    <FaRegTrashAlt className="mr-2" /> 删除此题库
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isEditingBankDetails ? (
              <div className="space-y-4 pb-6 mb-6 border-b dark:border-gray-700">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题库名称</label>
                  <Input 
                    id="bankName" 
                    value={editBankName} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditBankName(e.target.value)} 
                    placeholder="输入题库名称"
                    className="text-base"
                  />
                </div>
                <div>
                  <label htmlFor="bankDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题库描述 (可选)</label>
                  <Textarea 
                    id="bankDescription" 
                    value={editBankDescription} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditBankDescription(e.target.value)} 
                    placeholder="输入题库描述"
                    rows={3}
                    className="text-base"
                  />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditingBankDetails(false)} size="sm">取消</Button>
                    <Button onClick={handleSaveBankDetails} size="sm">保存更改</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 pb-6 mb-6 border-b dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">描述:</span> {selectedBank.description || '未提供描述'}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">题目数量:</span> {selectedBank.questions ? selectedBank.questions.length : 0} 题
                </p>
              </div>
            )}

            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">题目列表 ({filteredQuestions.length}/{selectedBank.questions ? selectedBank.questions.length : 0}题)</h3>
                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={handleOpenAddQuestionModal}>
                    <FaPlusCircle className="mr-2" /> 添加新题目
                </Button>
            </div>
            
            <div className="mb-4 relative">
              <div className="flex">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <Input
                    type="text"
                    placeholder="搜索题目..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                {searchQuery && (
                  <Button 
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => setSearchQuery('')}
                  >
                    <span className="sr-only">清除</span>
                    ×
                  </Button>
                )}
              </div>
            </div>

            {filteredQuestions.length > 0 ? (
                <ul className="space-y-3">
                    {filteredQuestions.map((question, index) => (
                        <li key={question.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md shadow-sm flex justify-between items-center">
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{index + 1}.</span>
                                <span className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-xs sm:max-w-sm md:max-w-md" title={question.content}>{question.content}</span>
                                <span className="ml-3 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200">
                                    {QUESTION_TYPE_NAMES[question.type] || question.type}
                                </span>
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenEditQuestionModal(question)}>
                                    <FaEdit className="h-3.5 w-3.5" />
                                    <span className="sr-only">编辑题目</span>
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => handleDeleteQuestion(question.id, question.content)}
                                >
                                    <FaTrash className="h-3.5 w-3.5" />
                                    <span className="sr-only">删除题目</span>
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                    {searchQuery ? '没有找到匹配的题目。' : '此题库中还没有题目。点击上方 "添加新题目" 开始创建。'}
                </p>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedBankId && (questionBanks && questionBanks.length > 0) && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400">请从上方选择一个题库进行管理，或创建一个新题库。</p>
        </div>
      )}
       {!selectedBankId && (questionBanks && questionBanks.length === 0) && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-400">您还没有任何题库。请点击上方 "创建新题库" 开始。</p>
        </div>
      )}

      {selectedBankId && (
        <QuestionFormModal 
            isOpen={isQuestionModalOpen} 
            onClose={handleQuestionModalClose} 
            bankId={selectedBankId}
            questionToEdit={editingQuestion}
            onSubmitSuccess={() => {
                handleQuestionModalClose();
            }}
        />
      )}
    </div>
  );
}

// 主页面组件，优化为静态导出方式
export default function ManageBanksPage() {
  const { theme } = useThemeStore();

  // 使用安全的方式在客户端获取URL参数
  const [initialTempBankId, setInitialTempBankId] = useState<string | null>(null);
  
  useEffect(() => {
    // 在这里添加关键的静态路径标记，帮助构建系统识别路径
    // 通过注释或隐藏元素确保这些路径被识别 - 这是静态导出的关键
    const paths = [
      '/quiz/banks/manage/',
      '/quiz/banks/manage/index.html',
      '/quiz/banks/manage/index',
      '/quiz/banks/manage'
    ];
    console.log('可用的静态路径:', paths);
    
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tempBankId = urlParams.get('tempBankId');
        if (tempBankId) {
          setInitialTempBankId(tempBankId);
          // 清理URL，避免重复加载
          const url = new URL(window.location.href);
          url.searchParams.delete('tempBankId');
          window.history.replaceState({}, '', url.toString());
        }
      } catch (error) {
        console.error("获取URL参数出错:", error);
      }
    }
  }, []);

  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center items-center dark:bg-gray-900">
        <BeatLoader color={theme === 'dark' ? '#38BDF8' : '#3B82F6'} />
        <p className="text-xl text-gray-500 dark:text-gray-400 mt-4">加载管理界面...</p>
      </div>
    }>
      {/* 添加隐藏的链接元素，帮助静态导出系统识别路由 */}
      <div style={{ display: 'none' }}>
        <a href="/quiz/banks/manage">管理题库</a>
        <a href="/quiz/banks/manage/">管理题库带斜杠</a>
        <a href="/quiz/banks/manage/index.html">管理题库HTML</a>
      </div>
      <ManageBanksPageContent initialTempBankId={initialTempBankId} />
    </Suspense>
  );
} 