import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Question, QuestionBank, QuestionType } from '@/types/quiz';

/**
 * 生成唯一ID
 * 使用uuid v4标准生成完全随机的唯一标识符
 * 
 * @returns {string} 返回生成的唯一ID字符串
 */
export const generateId = (): string => uuidv4();

/**
 * 创建空题库
 * 初始化一个没有题目的新题库，包含基本元数据
 * 
 * @param {string} name - 题库名称
 * @param {string} [description] - 题库描述（可选）
 * @returns {QuestionBank} 返回创建的空题库对象
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
 * 根据提供的参数创建一个完整的题目对象
 * 
 * @param {QuestionType} type - 题目类型（单选、多选、判断等）
 * @param {string} content - 题目内容
 * @param {{ content: string }[]} [options=[]] - 题目选项列表
 * @param {string|string[]} [answer=''] - 题目答案（单选/判断题为字符串，多选题为字符串数组）
 * @param {string} [explanation] - 题目解析（可选）
 * @param {string[]} [tags=[]] - 题目标签（可选）
 * @returns {Question} 返回创建的题目对象
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
 * 导出题库为CSV格式
 * 将题库中的所有题目转换为CSV格式文本
 * 
 * @param {QuestionBank} bank - 要导出的题库
 * @returns {string} 返回包含题库所有题目的CSV格式文本
 */
export const exportToCSV = (bank: QuestionBank): string => {
  const rows = bank.questions.map(q => {
    // 格式化答案
    let formattedAnswer = q.answer;
    if ((q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) && q.options && q.options.length > 0) {
      // 创建选项ID到字母的映射（将UUID映射为A, B, C等字母）
      const idToLetter = new Map();
      q.options.forEach((opt, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C...
        idToLetter.set(opt.id, letter);
      });
      
      // 将选项ID转换为字母
      if (q.type === QuestionType.SingleChoice && typeof q.answer === 'string') {
        // 单选题: 将UUID转换为字母（如"3d52ae73-7704..."→"B"）
        formattedAnswer = idToLetter.get(q.answer) || q.answer;
      } else if (q.type === QuestionType.MultipleChoice && Array.isArray(q.answer)) {
        // 多选题: 将UUID数组转换为字母数组，然后用逗号连接（如["id1","id2"]→"A,C"）
        formattedAnswer = q.answer
          .map(id => idToLetter.get(id) || id)
          .join(',');
      }
    } else if (q.type === QuestionType.TrueFalse && typeof q.answer === 'string') {
      // 确保判断题答案是小写的true/false
      formattedAnswer = q.answer.toLowerCase();
    }

    // 创建基础行数据
    const baseRow = {
      type: q.type,
      content: q.content,
      answer: formattedAnswer,
      explanation: q.explanation || '',
      tags: q.tags?.join(',') || ''
    };
    
    // 为选择题添加选项列（optionA, optionB, optionC...）
    if (q.options && q.options.length > 0) {
      const optionsObj = q.options.reduce((acc, opt, index) => {
        const optKey = `option${String.fromCharCode(65 + index)}`; // 选项A, B, C...
        return { ...acc, [optKey]: opt.content };
      }, {});
   
      return { ...baseRow, ...optionsObj };
    }
    
    return baseRow;
  });
  
  // 使用PapaParse库将JSON数组转换为CSV字符串
  return Papa.unparse(rows);
};

/**
 * 导出题库为Excel格式
 * 将题库中的所有题目转换为Excel文件内容
 * 
 * @param {QuestionBank} bank - 要导出的题库
 * @returns {Blob} 返回包含Excel文件内容的Blob对象
 */
export const exportToExcel = (bank: QuestionBank): Blob => {
  const rows = bank.questions.map(q => {
    // 格式化答案
    let formattedAnswer = q.answer;
    if ((q.type === QuestionType.SingleChoice || q.type === QuestionType.MultipleChoice) && q.options && q.options.length > 0) {
      // 创建选项ID到字母的映射（将UUID映射为A, B, C等字母）
      const idToLetter = new Map();
      q.options.forEach((opt, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C...
        idToLetter.set(opt.id, letter);
      });
      
      // 将选项ID转换为字母
      if (q.type === QuestionType.SingleChoice && typeof q.answer === 'string') {
        // 单选题: 将UUID转换为字母（如"3d52ae73-7704..."→"B"）
        formattedAnswer = idToLetter.get(q.answer) || q.answer;
      } else if (q.type === QuestionType.MultipleChoice && Array.isArray(q.answer)) {
        // 多选题: 将UUID数组转换为字母数组，然后用逗号连接（如["id1","id2"]→"A,C"）
        formattedAnswer = q.answer
          .map(id => idToLetter.get(id) || id)
          .join(',');
      }
    } else if (q.type === QuestionType.TrueFalse && typeof q.answer === 'string') {
      // 确保判断题答案是小写的true/false
      formattedAnswer = q.answer.toLowerCase();
    }

    // 创建基础行数据
    const baseRow: Record<string, any> = {
      type: q.type,
      content: q.content,
      answer: formattedAnswer,
      explanation: q.explanation || '',
      tags: q.tags?.join(',') || ''
    };
    
    // 为选择题添加选项列（optionA, optionB, optionC...）
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, index) => {
        const optKey = `option${String.fromCharCode(65 + index)}`; // 选项A, B, C...
        baseRow[optKey] = opt.content;
      });
    }
    
    return baseRow;
  });
  
  // 使用XLSX库将数据转换为Excel工作表
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, bank.name);
  
  // 将Excel工作簿转换为二进制数据并返回为Blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * 从CSV导入题库
 * 解析CSV文本并转换为题库对象
 * 
 * @param {string} csvString - CSV格式的文本内容
 * @param {string} bankName - 导入后的题库名称
 * @returns {QuestionBank} 返回解析后的题库对象
 */
export const importFromCSV = (csvString: string, bankName: string): QuestionBank => {
  // 使用PapaParse库解析CSV文本
  const parsed = Papa.parse(csvString, { header: true });
  const questions: Question[] = parsed.data
    .filter((row: any) => row.content && row.type) // 过滤无效行（必须包含content和type字段）
    .map((row: any) => {
      const type = row.type as QuestionType;
      const content = row.content;
      
      // 查找并解析所有选项 (optionA, optionB, ...)
      const optionKeys = Object.keys(row).filter(key => /^option[A-Z]$/.test(key));
      const options = optionKeys
        .filter(key => row[key]?.trim()) // 过滤空选项
        .map(key => ({
          id: key.replace('option', ''), // 使用选项字母作为ID (如"optionA"→"A")
          content: row[key]
        }));

      // 处理不同类型题目的答案
      let answer: string | string[] = row.answer;
      if (type === QuestionType.MultipleChoice) {
        // 多选题答案是逗号分隔的字母，转换为字母数组 (如"A,C"→["A","C"])
        answer = typeof row.answer === 'string' 
          ? row.answer.split(',').map((a: string) => a.trim()).filter(Boolean)
          : [];
      } else if (type === QuestionType.SingleChoice) {
        // 单选题答案是单个字母 (如"B")
        answer = typeof row.answer === 'string' ? row.answer.trim() : '';
      } else if (type === QuestionType.TrueFalse) {
        // 确保判断题答案为小写的 'true' 或 'false'
        if (typeof row.answer === 'string') {
          const answerText = row.answer.toString().trim().toLowerCase();
          // 支持多种表示真假的格式
          if (['true', 't', '1', '正确', '对', 'yes', 'y', '√'].includes(answerText)) {
            answer = 'true';
          } else if (['false', 'f', '0', '错误', '错', 'no', 'n', '×'].includes(answerText)) {
            answer = 'false';
          } else {
            answer = answerText; // 保留原值
          }
        }
      }
      
      // 处理标签（逗号分隔的字符串转为数组）
      const tags = row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [];
      
      // 创建题目对象
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
  
  // 创建并返回新题库
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

      // 查找所有选项 (optionA, optionB, ...)
      const optionKeys = Object.keys(row).filter(key => /^option[A-Z]$/.test(key));
      const options = optionKeys
        .filter(key => row[key]?.trim())
        .map(key => ({
          id: key.replace('option', ''), // 使用选项字母作为ID
          content: row[key]
        }));
      
      // 处理不同类型题目的答案
      let answer: string | string[] = row.answer;
      if (type === QuestionType.MultipleChoice) {
        // 多选题答案是逗号分隔的字母，转换为字母数组
        answer = typeof row.answer === 'string' 
          ? row.answer.split(',').map((a: string) => a.trim()).filter(Boolean)
          : [];
      } else if (type === QuestionType.SingleChoice) {
        // 单选题答案是单个字母
        answer = typeof row.answer === 'string' ? row.answer.trim() : '';
      } else if (type === QuestionType.TrueFalse) {
        // 确保判断题答案为小写的 'true' 或 'false'
        if (typeof row.answer === 'string') {
          const answerText = row.answer.toString().trim().toLowerCase();
          if (['true', 't', '1', '正确', '对', 'yes', 'y', '√'].includes(answerText)) {
            answer = 'true';
          } else if (['false', 'f', '0', '错误', '错', 'no', 'n', '×'].includes(answerText)) {
            answer = 'false';
          } else {
            answer = answerText; // 保留原值
          }
        }
      }
      
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