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

/**
 * 创建新题库的模态对话框组件
 */
export default function CreateBankModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBankModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 每次打开重置数据
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

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