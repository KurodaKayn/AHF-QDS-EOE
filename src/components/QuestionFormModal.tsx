/**
 * 题目创建/编辑模态对话框组件
 * 
 * 该组件提供题目管理的完整界面，支持以下功能：
 * 1. 新建题目（单选题、多选题、判断题、简答题、填空题）
 * 2. 编辑现有题目
 * 3. 动态管理选项（添加/删除选项）
 * 4. 选择和验证答案
 * 5. 添加题目解析
 * 
 * 组件状态：
 * - content: 题目内容
 * - type: 题目类型（单选、多选、判断、简答、填空）
 * - options: 选项列表（对于选择题和判断题）
 * - answer: 正确答案（格式根据题型不同：字符串或字符串数组）
 * - explanation: 题目解析（可选）
 * - isLoading: 提交状态指示器
 * 
 * 组件设计特点：
 * - 针对不同题型提供不同的表单界面
 * - 表单验证确保数据完整性
 * - 支持选项的动态添加和删除
 * - 使用zustand store进行状态管理
 * - 实现重复题目检测
 */
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

  /**
   * 模态框打开或编辑模式变化时初始化表单数据
   * 
   * 工作流程：
   * 1. 检测模态框打开状态和编辑/新建模式
   * 2. 编辑模式：加载现有题目数据到表单
   * 3. 新建模式：重置表单为默认值
   * 4. 重置加载状态为false
   * 
   * 这种设计确保表单始终显示正确的数据，无论是编辑现有题目还是创建新题目
   */
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

  /**
   * 处理题目类型变更
   * 
   * 工作流程：
   * 1. 更新题目类型状态
   * 2. 根据新类型动态调整选项和答案格式：
   *    - 判断题：设置固定的"正确/错误"选项，重置答案
   *    - 简答题/填空题：清空选项，重置答案为空字符串
   *    - 单选题/多选题：恢复默认选项（如需），设置适当答案格式
   * 
   * 该函数确保不同题型之间切换时，表单状态保持一致性，避免类型不匹配的数据
   * 
   * @param newType - 新的题目类型
   */
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

  /**
   * 处理选项内容变更
   * 
   * 工作流程：
   * 1. 根据选项ID找到需要更新的选项
   * 2. 更新该选项的内容，保持其他选项不变
   * 
   * 该函数允许用户编辑选项内容，同时保持选项ID不变，这对维护选项和答案的关联关系很重要
   * 
   * @param optionId - 要更新的选项ID
   * @param value - 新的选项内容
   */
  const handleOptionContentChange = (optionId: string, value: string) => {
    setOptions(prevOptions => 
      prevOptions.map(opt => opt.id === optionId ? { ...opt, content: value } : opt)
    );
  };

  /**
   * 添加新选项
   * 
   * 工作流程：
   * 1. 生成唯一的选项ID
   * 2. 创建一个空的新选项
   * 3. 将新选项添加到当前选项列表末尾
   * 
   * 该函数使用不可变更新模式，创建新的选项数组而不是修改现有数组
   */
  const handleAddOption = () => {
    setOptions(prevOptions => [...prevOptions, { id: uuidv4(), content: '' }]);
  };

  /**
   * 移除选项
   * 
   * 工作流程：
   * 1. 从选项数组中过滤掉指定ID的选项
   * 2. 如果被删选项是当前答案，同时更新答案状态：
   *    - 单选题：如果当前答案是被删选项，清空答案
   *    - 多选题：从答案数组中移除被删选项ID
   * 
   * 该函数确保选项删除后，答案状态保持一致性，防止引用不存在的选项
   * 
   * @param optionId - 要删除的选项ID
   */
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

  /**
   * 处理答案选择
   * 
   * 工作流程：
   * 1. 根据题目类型执行不同的答案处理逻辑：
   *    - 单选题/判断题：直接设置选中的选项ID为答案
   *    - 多选题：切换选中状态（已选则移除，未选则添加）
   * 
   * 该函数确保答案格式与题目类型匹配，并维护多选题答案的数组状态
   * 
   * @param optionId - 用户选择/取消选择的选项ID
   */
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
   * 
   * 工作流程：
   * 1. 表单验证：
   *    - 检查题目内容是否为空
   *    - 验证选择题选项是否完整
   *    - 确认是否选择了答案
   *    - 验证填空题/简答题是否有答案
   * 2. 如验证失败，显示错误提示并中止提交
   * 3. 设置加载状态为true
   * 4. 准备题目数据对象（不包含id字段）
   * 5. 根据编辑/新建模式选择合适的store方法：
   *    - 编辑模式：调用updateQuestionInBank更新现有题目
   *    - 新建模式：调用addQuestionToBank添加新题目
   * 6. 处理操作结果（成功/失败/重复）
   * 7. 成功时调用回调函数并关闭模态框
   * 8. 设置加载状态为false
   * 
   * 该函数是表单的核心逻辑，负责数据验证、提交和反馈处理
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
