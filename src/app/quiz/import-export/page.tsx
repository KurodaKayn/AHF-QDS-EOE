'use client';

import { useState, useRef } from 'react';
import { FaFileImport, FaFileExport, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useQuizStore } from '@/hooks/useQuizStore';
import { exportToCSV, exportToExcel, importFromCSV, importFromExcel } from '@/utils/quiz';
import { DEFAULT_EXPORT_FILENAME } from '@/constants/quiz';
import { QuestionBank, Question, QuestionType } from '@/types/quiz';

/**
 * 题库导入/导出页面组件
 * 
 * 该组件提供两个主要功能：
 * 1. 从CSV或Excel文件导入题目到新建题库
 * 2. 将现有题库导出为CSV或Excel文件
 * 
 * 组件状态：
 * - selectedBankId: 当前选中的题库ID（用于导出）
 * - importFormat/exportFormat: 导入/导出的文件格式（CSV或Excel）
 * - importName: 导入时新建题库的名称
 * - importSuccess/exportSuccess: 操作成功的状态标志
 * - importResult: 导入操作的结果统计（总数、成功数、重复数）
 */
export default function ImportExportPage() {
  const { questionBanks, addQuestionBank, addQuestionToBank } = useQuizStore();
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [importFormat, setImportFormat] = useState<'csv' | 'excel'>('csv');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [importName, setImportName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importResult, setImportResult] = useState<{ total: number; added: number; duplicates: number } | null>(null);

  /**
   * 处理文件导入功能
   * 
   * @param event - 文件输入变更事件，包含用户选择的文件
   * 
   * 工作流程：
   * 1. 检查文件和题库名称是否有效
   * 2. 根据选择的格式（CSV/Excel）读取并解析文件内容
   * 3. 创建新题库并添加解析出的题目
   * 4. 处理单选题和多选题的特殊答案格式
   * 5. 统计导入结果（总数、成功添加数、重复数）
   * 6. 更新UI状态，显示导入结果
   * 
   * 导入过程中会进行重复检查，避免添加重复题目
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importName.trim()) {
        alert('请输入题库名称并选择文件。');
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        let importedData: QuestionBank | null = null; 
        
        if (importFormat === 'csv') {
          const content = e.target?.result as string;
          importedData = importFromCSV(content, importName.trim());
        } else {
          const content = e.target?.result as ArrayBuffer;
          importedData = importFromExcel(content, importName.trim());
        }
        
        if (!importedData) {
            throw new Error('无法从文件解析数据。');
        }

        const newBank = await addQuestionBank(importedData.name, importedData.description);
        
        let addedCount = 0;
        let duplicateCount = 0;
        const totalCount = importedData.questions ? importedData.questions.length : 0;

        if (newBank && importedData.questions && importedData.questions.length > 0) {
            console.log('导入题目总数:', importedData.questions.length);
            
            for (let index = 0; index < importedData.questions.length; index++) {
                const question = importedData.questions[index];
                console.log(`处理第${index+1}题:`, question.content.substring(0, 30) + '...');
                
                const { id, ...questionData } = question;
                
                if (question.type === QuestionType.SingleChoice && typeof question.answer === 'string' && question.options && question.options.length > 0) {
                    const answerLetter = question.answer.trim();
                    const matchingOption = question.options.find(opt => opt.id === answerLetter);
                    if (matchingOption) {
                        console.log(`单选题答案使用字母ID: ${answerLetter}`);
                    } else {
                        console.log(`单选题答案不匹配任何选项: ${answerLetter}`);
                    }
                }
                
                if (question.type === QuestionType.MultipleChoice && Array.isArray(question.answer) && question.options && question.options.length > 0) {
                    console.log(`多选题答案: ${question.answer.join(',')}`);
                }
                
                const result = await addQuestionToBank(newBank.id, questionData);
                console.log('添加结果:', result.isDuplicate ? '重复' : (result.question ? '成功' : '失败'));
                
                if (result.isDuplicate) {
                    duplicateCount++;
                } else if (result.question) {
                    addedCount++;
                }
            }
            
            console.log('导入结果: 总数', totalCount, '成功', addedCount, '重复', duplicateCount);
        }
        
        setImportResult({
            total: totalCount,
            added: addedCount,
            duplicates: duplicateCount
        });
        
        setImportName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        setImportSuccess(true);
        setTimeout(() => {
            setImportSuccess(false);
            setTimeout(() => setImportResult(null), 5000);
        }, 3000);
      } catch (error: any) {
        console.error('导入失败:', error);
        alert(`导入失败: ${error.message || '请检查文件格式是否正确'}`);
      }
    };

    if (importFormat === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  /**
   * 处理题库导出功能
   * 
   * 工作流程：
   * 1. 验证是否选择了有效的题库
   * 2. 根据选择的格式（CSV/Excel）生成相应的文件内容
   * 3. 创建Blob对象并生成下载链接
   * 4. 触发文件下载并设置成功状态
   * 5. 错误处理和用户反馈
   * 
   * 导出文件命名规则：使用题库名称，如未设置则使用默认文件名
   * 支持的格式：CSV（逗号分隔值）和Excel（.xlsx）
   */
  const handleExport = () => {
    if (!selectedBankId) return;
    
    const bank = questionBanks.find(b => b.id === selectedBankId);
    if (!bank) return;

    try {
      if (exportFormat === 'csv') {
        const csv = exportToCSV(bank);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bank.name || DEFAULT_EXPORT_FILENAME}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = exportToExcel(bank);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bank.name || DEFAULT_EXPORT_FILENAME}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">导入/导出题库</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 导入题库 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <FaFileImport className="text-blue-600 dark:text-blue-400 mr-2" size={20} />
            <h2 className="text-lg font-semibold dark:text-white">导入题库</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                题库名称
              </label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="输入导入后的题库名称"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                导入格式
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="importFormat"
                    checked={importFormat === 'csv'}
                    onChange={() => setImportFormat('csv')}
                  />
                  <span className="ml-2 dark:text-gray-300">CSV</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="importFormat"
                    checked={importFormat === 'excel'}
                    onChange={() => setImportFormat('excel')}
                  />
                  <span className="ml-2 dark:text-gray-300">Excel</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                选择文件
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept={importFormat === 'csv' ? '.csv' : '.xlsx,.xls'}
                onChange={handleImport}
                className="w-full text-sm text-gray-500 dark:text-gray-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300
                         hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
              />
            </div>
            
            {importSuccess && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <FaCheck className="mr-1" />
                <span>导入成功</span>
              </div>
            )}
            
            {importResult && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  共导入 {importResult.total} 题，成功添加 {importResult.added} 题
                </p>
                {importResult.duplicates > 0 && (
                  <p className="flex items-center mt-1 text-amber-600 dark:text-amber-400 text-sm">
                    <FaExclamationTriangle className="mr-1" size={12} />
                    跳过 {importResult.duplicates} 个重复题目
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 导出题库 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <FaFileExport className="text-green-600 dark:text-green-400 mr-2" size={20} />
            <h2 className="text-lg font-semibold dark:text-white">导出题库</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                选择题库
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- 请选择题库 --</option>
                {questionBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.questions.length}题)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                导出格式
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="exportFormat"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                  />
                  <span className="ml-2 dark:text-gray-300">CSV</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="exportFormat"
                    checked={exportFormat === 'excel'}
                    onChange={() => setExportFormat('excel')}
                  />
                  <span className="ml-2 dark:text-gray-300">Excel</span>
                </label>
              </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={!selectedBankId}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium
                        ${!selectedBankId ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'}`}
            >
              <FaFileExport className="mr-2" />
              导出
            </button>
            
            {exportSuccess && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <FaCheck className="mr-1" />
                <span>导出成功</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 