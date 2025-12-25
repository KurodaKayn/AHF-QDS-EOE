import { nanoid } from 'nanoid';
import * as XLSX from 'xlsx';
import { Question, QuestionBank, QuestionType } from '@/types/quiz';

/**
 * 生成唯一ID
 */
export const generateId = (): string => nanoid();

/**
 * 创建空题库
 */
export const createEmptyBank = (name: string, description?: string): QuestionBank => {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    description,
    questions: [],
    createdAt: now,
    updatedAt: now
  };
};

/**
 * 创建新题目
 */
export const createQuestion = (
  type: QuestionType,
  content: string,
  options: { content: string }[] = [],
  answer: string | string[] = '',
  explanation?: string,
  tags: string[] = []
): Question => {
  const now = Date.now();
  return {
    id: generateId(),
    type,
    content,
    options: options.map(opt => ({ id: generateId(), content: opt.content })),
    answer,
    explanation,
    tags,
    createdAt: now,
    updatedAt: now
  };
};

/**
 * 导出题库为CSV
 */
export const exportToCSV = (bank: QuestionBank): string => {
  const rows = bank.questions.map(q => {
    // 格式化答案
    let formattedAnswer = q.answer;
    if (q.type === QuestionType.MultipleChoice && Array.isArray(q.answer)) {
      // 对于多选题，将选项ID数组转换为逗号分隔的字符串
      formattedAnswer = q.answer.join(',');
    } else if (q.type === QuestionType.TrueFalse && typeof q.answer === 'string') {
      // 确保判断题答案是小写的true/false
      formattedAnswer = q.answer.toLowerCase();
    }

    const baseRow: Record<string, any> = {
      type: q.type,
      content: q.content,
      answer: formattedAnswer,
      explanation: q.explanation || '',
      tags: q.tags?.join(',') || ''
    };
    
    // 为选择题添加选项
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, index) => {
        const optKey = `option${String.fromCharCode(65 + index)}`; // 选项A, B, C...
        baseRow[optKey] = opt.content;
      });
    }
    
    return baseRow;
  });
  
  // 使用 xlsx 导出 CSV（统一使用一个库）
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(worksheet);
};

/**
 * 导出题库为Excel
 */
export const exportToExcel = (bank: QuestionBank): Blob => {
  const rows = bank.questions.map(q => {
    // 格式化答案
    let formattedAnswer = q.answer;
    if (q.type === QuestionType.MultipleChoice && Array.isArray(q.answer)) {
      // 对于多选题，将选项ID数组转换为逗号分隔的字符串
      formattedAnswer = q.answer.join(',');
    } else if (q.type === QuestionType.TrueFalse && typeof q.answer === 'string') {
      // 确保判断题答案是小写的true/false
      formattedAnswer = q.answer.toLowerCase();
    }

    const baseRow: Record<string, any> = {
      type: q.type,
      content: q.content,
      answer: formattedAnswer,
      explanation: q.explanation || '',
      tags: q.tags?.join(',') || ''
    };
    
    // 为选择题添加选项
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, index) => {
        const optKey = `option${String.fromCharCode(65 + index)}`; // 选项A, B, C...
        baseRow[optKey] = opt.content;
      });
    }
    
    return baseRow;
  });
  
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, bank.name);
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * 从CSV导入题库
 */
export const importFromCSV = (csvString: string, bankName: string): QuestionBank => {
  // 使用 xlsx 解析 CSV（统一使用一个库）
  const workbook = XLSX.read(csvString, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const questions: Question[] = data
    .filter((row: any) => row.content && row.type) // 过滤无效行
    .map((row: any) => {
      const type = row.type as QuestionType;
      const content = row.content;
      
      // 处理不同类型题目的答案
      let answer: string | string[] = row.answer;
      if (type === QuestionType.MultipleChoice) {
        // 处理多选题答案，可能以逗号分隔的字符串或带有双引号的格式
        answer = typeof row.answer === 'string' 
          ? row.answer.replace(/["']/g, '').split(/\s*,\s*/).filter(Boolean)
          : row.answer;
      } else if (type === QuestionType.TrueFalse) {
        // 确保判断题答案为小写的 'true' 或 'false'
        if (typeof row.answer === 'string') {
          const answerText = row.answer.toString().trim().toLowerCase();
          // 处理各种可能的表示形式
          if (['true', 't', '1', '正确', '对', 'yes', 'y', '√'].includes(answerText)) {
            answer = 'true';
          } else if (['false', 'f', '0', '错误', '错', 'no', 'n', '×'].includes(answerText)) {
            answer = 'false';
          } else {
            answer = answerText; // 保留原值
          }
        }
      }
      
      // 查找所有选项 (optionA, optionB, ...)
      const optionKeys = Object.keys(row).filter(key => /^option[A-Z]$/.test(key));
      const options = optionKeys
        .filter(key => row[key]?.trim())
        .map(key => ({
          id: key.replace('option', ''), // 使用选项字母作为ID
          content: row[key]
        }));
      
      const tags = row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      const now = Date.now();
      return {
        id: generateId(),
        type,
        content,
        options: options.length > 0 ? options : undefined,
        answer,
        explanation: row.explanation || undefined,
        tags: tags.length > 0 ? tags : undefined,
        createdAt: now,
        updatedAt: now
      };
    });
  
  const now = Date.now();
  return {
    id: generateId(),
    name: bankName,
    questions,
    createdAt: now,
    updatedAt: now
  };
};

/**
 * 从Excel导入题库
 */
export const importFromExcel = (buffer: ArrayBuffer, bankName: string): QuestionBank => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  const questions: Question[] = data
    .filter((row: any) => row.content && row.type)
    .map((row: any) => {
      const type = row.type as QuestionType;
      const content = row.content;
      
      // 处理不同类型题目的答案
      let answer: string | string[] = row.answer;
      if (type === QuestionType.MultipleChoice) {
        // 处理多选题答案，可能以逗号分隔的字符串或带有双引号的格式
        answer = typeof row.answer === 'string' 
          ? row.answer.replace(/["']/g, '').split(/\s*,\s*/).filter(Boolean)
          : row.answer;
      } else if (type === QuestionType.TrueFalse) {
        // 确保判断题答案为小写的 'true' 或 'false'
        if (typeof row.answer === 'string') {
          const answerText = row.answer.toString().trim().toLowerCase();
          // 处理各种可能的表示形式
          if (['true', 't', '1', '正确', '对', 'yes', 'y', '√'].includes(answerText)) {
            answer = 'true';
          } else if (['false', 'f', '0', '错误', '错', 'no', 'n', '×'].includes(answerText)) {
            answer = 'false';
          } else {
            answer = answerText; // 保留原值
          }
        }
      }
      
      // 查找所有选项 (optionA, optionB, ...)
      const optionKeys = Object.keys(row).filter(key => /^option[A-Z]$/.test(key));
      const options = optionKeys
        .filter(key => row[key]?.trim())
        .map(key => ({
          id: key.replace('option', ''), // 使用选项字母作为ID
          content: row[key]
        }));
      
      const tags = row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      const now = Date.now();
      return {
        id: generateId(),
        type,
        content,
        options: options.length > 0 ? options : undefined,
        answer,
        explanation: row.explanation || undefined,
        tags: tags.length > 0 ? tags : undefined,
        createdAt: now,
        updatedAt: now
      };
    });
  
  const now = Date.now();
  return {
    id: generateId(),
    name: bankName,
    questions,
    createdAt: now,
    updatedAt: now
  };
}; 