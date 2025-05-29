'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Question, QuestionType, QuestionOption } from '@/types/quiz';
import { QUESTION_TYPE_NAMES } from '@/constants/quiz';
import { useQuizStore } from '@/hooks/useQuizStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { FaTrash, FaPlus } from 'react-icons/fa';

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  questionToEdit?: Question | null;
  onSubmitSuccess?: () => void;
}

const defaultQuestionOptions: QuestionOption[] = [
  { id: uuidv4(), content: '' },
  { id: uuidv4(), content: '' },
  { id: uuidv4(), content: '' },
  { id: uuidv4(), content: '' },
];

export default function QuestionFormModal({
  isOpen,
  onClose,
  bankId,
  questionToEdit,
  onSubmitSuccess,
}: QuestionFormModalProps) {
  const { addQuestionToBank, updateQuestionInBank } = useQuizStore();

  const [content, setContent] = useState('');
  const [type, setType] = useState<QuestionType>(QuestionType.SingleChoice);
  const [options, setOptions] = useState<QuestionOption[]>(defaultQuestionOptions);
  const [answer, setAnswer] = useState<string | string[]>('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = useMemo(() => !!questionToEdit, [questionToEdit]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && questionToEdit) {
        setContent(questionToEdit.content);
        setType(questionToEdit.type);
        setOptions(questionToEdit.options && questionToEdit.options.length > 0 ? questionToEdit.options.map(opt => ({...opt})) : defaultQuestionOptions.map(opt => ({...opt})));
        setAnswer(questionToEdit.answer);
        setExplanation(questionToEdit.explanation || '');
      } else {
        // 重置新题目的表单
        setContent('');
        setType(QuestionType.SingleChoice);
        setOptions(defaultQuestionOptions.map(opt => ({...opt, content: ''}))); // 确保内容被清空
        setAnswer('');
        setExplanation('');
      }
      setIsLoading(false);
    }
  }, [isOpen, isEditMode, questionToEdit]);

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    // 根据类型重置选项和答案
    if (newType === QuestionType.TrueFalse) {
      setOptions([
        { id: 'true', content: '正确' }, // 为判断题使用固定ID，便于答案映射
        { id: 'false', content: '错误' },
      ]);
      setAnswer(''); // 单个字符串答案
    } else if (newType === QuestionType.ShortAnswer || newType === QuestionType.FillInBlank) {
      setOptions([]);
      setAnswer(''); // 单个字符串答案
    } else { // 单选题，多选题
      // 如果从非选择题切换回选择题，如果当前选项为空或是判断题选项，则恢复默认选项
      if (options.length < 2 || options.some(o => o.id === 'true' || o.id === 'false')) {
         setOptions(defaultQuestionOptions.map(opt => ({...opt, content: ''})));
      }
      setAnswer(newType === QuestionType.MultipleChoice ? [] : '');
    }
  };

  const handleOptionContentChange = (optionId: string, value: string) => {
    setOptions(prevOptions => 
      prevOptions.map(opt => opt.id === optionId ? { ...opt, content: value } : opt)
    );
  };

  const handleAddOption = () => {
    setOptions(prevOptions => [...prevOptions, { id: uuidv4(), content: '' }]);
  };

  const handleRemoveOption = (optionId: string) => {
    setOptions(prevOptions => prevOptions.filter(opt => opt.id !== optionId));
    // 如果被删除的选项是已选答案，也移除答案
    if (type === QuestionType.SingleChoice && answer === optionId) {
      setAnswer('');
    }
    if (type === QuestionType.MultipleChoice && Array.isArray(answer) && answer.includes(optionId)) {
      setAnswer(prevAns => (prevAns as string[]).filter(id => id !== optionId));
    }
  };

  const handleAnswerSelection = (optionId: string) => {
    if (type === QuestionType.SingleChoice || type === QuestionType.TrueFalse) {
      setAnswer(optionId);
    } else if (type === QuestionType.MultipleChoice) {
      setAnswer(prevAns => {
        const currentAnswers = Array.isArray(prevAns) ? prevAns : [];
        if (currentAnswers.includes(optionId)) {
          return currentAnswers.filter(id => id !== optionId);
        }
        return [...currentAnswers, optionId];
      });
    }
  };

  /**
   * 处理表单提交
   * 根据模式不同执行添加或更新题目的操作
   * 操作完成后会通过zustand store自动将数据保存到localStorage
   */
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('题目内容不能为空。');
      return;
    }
    if ((type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice) && options.some(opt => !opt.content.trim())) {
      toast.error('选择题的选项内容不能为空。');
      return;
    }
    if ((type === QuestionType.SingleChoice || type === QuestionType.TrueFalse) && !answer) {
      toast.error('请为单选题或判断题选择一个答案。');
      return;
    }
    if (type === QuestionType.MultipleChoice && (!Array.isArray(answer) || answer.length === 0)) {
      toast.error('请为多选题选择至少一个答案。');
      return;
    }
    if ((type === QuestionType.ShortAnswer || type === QuestionType.FillInBlank) && !(answer as string).trim()) {
        toast.error('请输入简答题或填空题的答案。');
        return;
    }

    setIsLoading(true);
    
    // 准备题目数据对象，不包含id字段
    // id会在zustand store的addQuestionToBank方法中自动生成
    const questionData: Omit<Question, 'id'> = {
      content: content.trim(),
      type,
      options: (type === QuestionType.ShortAnswer || type === QuestionType.FillInBlank) ? [] : options.map(o => ({id: o.id, content: o.content.trim()})),
      answer, // 已经是正确的格式（字符串或字符串数组）
      explanation: explanation.trim(),
      createdAt: questionToEdit?.createdAt || Date.now(),
      updatedAt: Date.now(),
      tags: questionToEdit?.tags || [], // 保留现有标签或默认为空
    };

    try {
      if (isEditMode && questionToEdit) {
        // 更新现有题目
        // updateQuestionInBank会更新zustand状态，然后persist中间件会自动将更新后的状态保存到localStorage
        await updateQuestionInBank(bankId, questionToEdit.id, questionData);
        toast.success('题目已成功更新。');
      } else {
        // 添加新题目
        // addQuestionToBank会更新zustand状态，然后persist中间件会自动将更新后的状态保存到localStorage
        const result = await addQuestionToBank(bankId, questionData);
        if (result.isDuplicate) {
          // 检测到重复题目（由zustand store中的checkDuplicateQuestion设置控制）
          toast.error('题目添加失败：题库中已存在相同题干的题目。');
          setIsLoading(false);
          return;
        } else if (result.question) {
          // 题目添加成功，此时数据已经保存到localStorage
          toast.success('题目已成功添加。');
        } else {
          // 添加失败
          toast.error('题目添加失败，请稍后重试。');
          setIsLoading(false);
          return;
        }
      }
      if (onSubmitSuccess) onSubmitSuccess();
      onClose(); // 成功后关闭模态框
    } catch (error) {
      toast.error('操作失败，请稍后重试。');
      console.error('Failed to save question:', error);
    }
    setIsLoading(false);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑题目' : '添加新题目'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-3 overflow-y-auto flex-grow pr-2">
          {/* 题目类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题目类型</label>
            <Select value={type} onValueChange={(value) => handleTypeChange(value as QuestionType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(QUESTION_TYPE_NAMES).map(([value, name]) => (
                  <SelectItem key={value} value={value}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 题目内容 */}
          <div>
            <label htmlFor="questionContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题目内容</label>
            <Textarea 
              id="questionContent" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="请输入题目内容..."
              rows={4}
              className="text-base"
            />
          </div>

          {/* 单选题、多选题、判断题的选项 */}
          {(type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice || type === QuestionType.TrueFalse) && (
            <div>
              <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">选项</label>
                 {(type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice) && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="text-xs">
                        <FaPlus className="mr-1" /> 添加选项
                    </Button>
                 )}
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[20px]">
                      {type !== QuestionType.TrueFalse ? String.fromCharCode(65 + index) + '.' : ''}
                    </span>
                    <Input 
                      value={option.content} 
                      onChange={(e) => handleOptionContentChange(option.id, e.target.value)} 
                      placeholder={`选项 ${String.fromCharCode(65 + index)} 内容`}
                      disabled={type === QuestionType.TrueFalse} // 判断题选项是固定的
                      className="text-base flex-grow"
                    />
                    {(type === QuestionType.SingleChoice || type === QuestionType.MultipleChoice) && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveOption(option.id)} 
                            disabled={options.length <= (type === QuestionType.SingleChoice ? 2 : 1)} // MC can have 1 option, SC needs 2
                            className="h-8 w-8 text-red-500 hover:text-red-700 disabled:text-gray-400"
                        >
                            <FaTrash className="h-4 w-4" />
                        </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Selection/Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">正确答案</label>
            {(type === QuestionType.SingleChoice || type === QuestionType.TrueFalse) && (
              <Select value={answer as string} onValueChange={handleAnswerSelection}>
                <SelectTrigger className="w-full"><SelectValue placeholder="选择正确答案..." /></SelectTrigger>
                <SelectContent>
                  {options.map((option, index) => (
                    <SelectItem key={option.id} value={option.id}>
                      {type !== QuestionType.TrueFalse ? String.fromCharCode(65 + index) + '. ' : ''}{option.content}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === QuestionType.MultipleChoice && (
              <div className="space-y-2 p-2 border dark:border-gray-600 rounded-md">
                {options.map((option, index) => (
                  <label key={option.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={Array.isArray(answer) && answer.includes(option.id)}
                      onChange={() => handleAnswerSelection(option.id)}
                      className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-500 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                    />
                    <span>{String.fromCharCode(65 + index)}. {option.content}</span>
                  </label>
                ))}
              </div>
            )}
            {(type === QuestionType.ShortAnswer || type === QuestionType.FillInBlank) && (
              <>
                <Textarea 
                  value={answer as string} 
                  onChange={(e) => setAnswer(e.target.value)} 
                  placeholder={type === QuestionType.FillInBlank 
                    ? "请输入答案，多个可接受的答案请用分号(;)分隔..."
                    : "请输入答案..."}
                  rows={3}
                  className="text-base"
                />
                {type === QuestionType.FillInBlank && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    提示：填空题支持多个答案，不同答案之间用分号(;)分隔。学生只需要输入其中任意一个答案即可被判定为正确。
                    如果答案本身包含多个连续分号，只有最后一个分号会被视为分隔符。
                  </p>
                )}
              </>
            )}
          </div>
          
          {/* Explanation */}
          <div>
            <label htmlFor="questionExplanation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">题目解析 (可选)</label>
            <Textarea 
              id="questionExplanation" 
              value={explanation} 
              onChange={(e) => setExplanation(e.target.value)} 
              placeholder="请输入题目解析..."
              rows={3}
              className="text-base"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t dark:border-gray-700">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '保存中...' : (isEditMode ? '保存更改' : '添加题目')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
