'use client';

import { useState, useRef } from 'react';
import { FaFileImport, FaFileExport, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useQuizStore } from '@/hooks/useQuizStore';
import { exportToCSV, exportToExcel, importFromCSV, importFromExcel } from '@/utils/quiz';
import { DEFAULT_EXPORT_FILENAME } from '@/constants/quiz';
import { QuestionBank, Question } from '@/types/quiz';

/**
 * 导入/导出题库页面
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
   * 处理文件导入
   */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importName.trim()) {
        alert('请输入题库名称并选择文件。');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
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

        const newBank: QuestionBank = addQuestionBank(importedData.name, importedData.description);
        
        let addedCount = 0;
        let duplicateCount = 0;
        const totalCount = importedData.questions ? importedData.questions.length : 0;

        if (newBank && importedData.questions && importedData.questions.length > 0) {
            importedData.questions.forEach((question: Question) => {
                const { id, ...questionData } = question;
                const result = addQuestionToBank(newBank.id, questionData);
                if (result.isDuplicate) {
                    duplicateCount++;
                } else if (result.question) {
                    addedCount++;
                }
            });
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
            // 5秒后清除导入结果
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
   * 处理导出操作
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