/**
 * 创建新题库的模态对话框组件
 * 
 * 该组件提供创建新题库的用户界面，包含以下功能：
 * 1. 输入题库名称（必填项）
 * 2. 输入题库描述（可选项）
 * 3. 表单验证（名称不能为空）
 * 4. 提交和取消操作
 * 
 * 组件状态：
 * - name: 题库名称
 * - description: 题库描述
 * - error: 表单验证错误信息
 * 
 * 组件接收的Props:
 * - isOpen: 控制模态框显示/隐藏的布尔值
 * - onClose: 关闭模态框的回调函数
 * - onSubmit: 提交表单数据的回调函数，接收名称和描述参数
 */

'use client';

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CreateBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

export default function CreateBankModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBankModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  /**
   * 模态框打开时重置表单数据
   * 
   * 当isOpen状态变化且为true时：
   * 1. 重置题库名称为空字符串
   * 2. 重置题库描述为空字符串
   * 3. 清除任何先前的表单错误
   * 
   * 这确保每次打开模态框时都能提供一个干净的表单界面
   */
  useEffect(() => {
    if (isOpen) {
      // 每次打开重置数据
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  /**
   * 处理表单提交
   * 
   * 工作流程：
   * 1. 验证题库名称是否为空
   * 2. 如为空，设置错误信息并中止提交
   * 3. 如验证通过，清除错误状态
   * 4. 调用onSubmit回调，传入名称和描述（都进行trim处理）
   * 5. 关闭模态框
   * 
   * 表单提交后，父组件将通过onSubmit回调获取题库数据并进行后续处理
   */
  const handleSubmit = () => {
    if (!name.trim()) {
      setError('题库名称不能为空');
      return;
    }
    
    setError('');
    onSubmit(name.trim(), description.trim());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">创建新题库</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              题库名称 <span className="text-red-500">*</span>
            </label>
            <Input
              id="bankName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="请输入题库名称"
              className="w-full"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label htmlFor="bankDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              题库描述 (可选)
            </label>
            <Textarea
              id="bankDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入题库描述信息..."
              rows={3}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">
            取消
          </Button>
          <Button onClick={handleSubmit}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 