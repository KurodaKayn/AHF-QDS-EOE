'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/quizStore';
import { Question, QuestionBank, QuestionType, QuestionOption } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FaPlusCircle, FaEdit, FaTrash, FaArrowLeft, FaEye, FaRegTrashAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { QUESTION_TYPE_NAMES } from '@/constants/quiz';
import QuestionFormModal from '@/components/QuestionFormModal';

export default function ManageBanksPage() {
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

  const sortedBanks = useMemo(() => {
    return [...(questionBanks || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [questionBanks]);

  const selectedBank = useMemo(() => {
    if (!selectedBankId) return null;
    return getQuestionBankById(selectedBankId) || null;
  }, [selectedBankId, getQuestionBankById, questionBanks]);

  // 组件挂载时从 URL hash 中获取 bankId
  useEffect(() => {
    try {
      // 仅在客户端执行
      if (typeof window !== 'undefined') {
        console.log("检查 URL hash");
        const hash = window.location.hash;
        
        if (hash && hash.length > 1) { // 排除空 hash (#)
          console.log("发现 hash:", hash);
          // 去除开头的 # 号
          const encodedData = hash.substring(1);
          const decodedData = decodeURIComponent(encodedData);
          console.log("解码后的数据:", decodedData);
          
          try {
            const data = JSON.parse(decodedData);
            console.log("解析后的对象:", data);
            
            if (data && data.selectedBankId) {
              const hashBankId = data.selectedBankId;
              console.log("从 hash 中提取的 bankId:", hashBankId);
              
              if (hashBankId && questionBanks.some(bank => bank.id === hashBankId)) {
                console.log("设置 selectedBankId 为:", hashBankId);
                setSelectedBankId(hashBankId);
                
                // 清除 URL 中的 hash，避免刷新页面时再次触发选择
                // 使用 history.replaceState 不会触发页面刷新
                window.history.replaceState(null, '', window.location.pathname);
              }
            }
          } catch (parseError) {
            console.error("解析 hash 数据出错:", parseError);
          }
        }
      }
    } catch (error) {
      console.error("处理 URL hash 出错:", error);
    }
  }, [questionBanks]);

  useEffect(() => {
    if (selectedBank) {
      setEditBankName(selectedBank.name);
      setEditBankDescription(selectedBank.description || '');
      setIsEditingBankDetails(false);
    } else {
      setEditBankName('');
      setEditBankDescription('');
      setIsEditingBankDetails(false);
      if (selectedBankId && !questionBanks.find(b => b.id === selectedBankId)) {
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
      } else if (typeof newBank === 'string') {
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
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveBankDetails} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                    <FaEdit className="mr-2" /> 保存更改
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingBankDetails(false)}>
                    取消
                  </Button>
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
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">题目列表 ({selectedBank.questions ? selectedBank.questions.length : 0}题)</h3>
                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={handleOpenAddQuestionModal}>
                    <FaPlusCircle className="mr-2" /> 添加新题目
                </Button>
            </div>

            {selectedBank.questions && selectedBank.questions.length > 0 ? (
                <ul className="space-y-3">
                    {selectedBank.questions.map((question, index) => (
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
                    此题库中还没有题目。点击上方 "添加新题目" 开始创建。
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