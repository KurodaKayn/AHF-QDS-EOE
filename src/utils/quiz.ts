import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import { Question, QuestionBank, QuestionType } from "@/types/quiz";

/**
 * 生成唯一ID
 */
export const generateId = (): string => nanoid();

/**
 * 创建空题库
 */
export const createEmptyBank = (
  name: string,
  description?: string
): QuestionBank => {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    description,
    questions: [],
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 创建新题目
 */
export const createQuestion = (
  type: QuestionType,
  content: string,
  options: { content: string }[] = [],
  answer: string | string[] = "",
  explanation?: string,
  tags: string[] = []
): Question => {
  const now = Date.now();
  return {
    id: generateId(),
    type,
    content,
    options: options.map((opt) => ({ id: generateId(), content: opt.content })),
    answer,
    explanation,
    tags,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 将题目转换为导出格式的通用函数
 */
const convertQuestionToExportFormat = (q: Question): Record<string, any> => {
  // 格式化答案
  let formattedAnswer = q.answer;
  if (q.type === QuestionType.MultipleChoice && Array.isArray(q.answer)) {
    formattedAnswer = q.answer.join(",");
  } else if (
    q.type === QuestionType.TrueFalse &&
    typeof q.answer === "string"
  ) {
    formattedAnswer = q.answer.toLowerCase();
  }

  const baseRow: Record<string, any> = {
    type: q.type,
    content: q.content,
    answer: formattedAnswer,
    explanation: q.explanation || "",
    tags: q.tags?.join(",") || "",
  };

  // 为选择题添加选项
  if (q.options && q.options.length > 0) {
    q.options.forEach((opt, index) => {
      const optKey = `option${String.fromCharCode(65 + index)}`;
      baseRow[optKey] = opt.content;
    });
  }

  return baseRow;
};

/**
 * 导出题库为CSV
 */
export const exportToCSV = (bank: QuestionBank): string => {
  const rows = bank.questions.map(convertQuestionToExportFormat);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(worksheet);
};

/**
 * 导出题库为Excel
 */
export const exportToExcel = (bank: QuestionBank): Blob => {
  const rows = bank.questions.map(convertQuestionToExportFormat);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, bank.name);

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * 将导入的行数据转换为题目的通用函数
 */
const convertImportRowToQuestion = (row: any): Question => {
  const type = row.type as QuestionType;
  const content = row.content;

  // 处理不同类型题目的答案
  let answer: string | string[] = row.answer;
  if (type === QuestionType.MultipleChoice) {
    answer =
      typeof row.answer === "string"
        ? row.answer
            .replace(/["']/g, "")
            .split(/\s*,\s*/)
            .filter(Boolean)
        : row.answer;
  } else if (type === QuestionType.TrueFalse) {
    if (typeof row.answer === "string") {
      const answerText = String(row.answer).trim().toLowerCase();
      if (
        ["true", "t", "1", "正确", "对", "yes", "y", "√"].includes(answerText)
      ) {
        answer = "true";
      } else if (
        ["false", "f", "0", "错误", "错", "no", "n", "×"].includes(answerText)
      ) {
        answer = "false";
      } else {
        answer = answerText;
      }
    }
  }

  // 查找所有选项
  const optionKeys = Object.keys(row).filter((key) =>
    /^option[A-Z]$/.test(key)
  );
  const options = optionKeys
    .filter((key) => {
      const val = row[key];
      return val !== null && val !== undefined && String(val).trim() !== "";
    })
    .map((key) => ({
      id: key.replace("option", ""), // 使用选项字母作为ID (A, B, C...)
      content: String(row[key]), // 强制转换为字符串
    }));

  const tags = row.tags
    ? String(row.tags)
        .split(",")
        .map((tag: string) => tag.trim())
    : [];

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
    updatedAt: now,
  };
};

/**
 * 从CSV导入题库
 */
export const importFromCSV = (
  csvString: string,
  bankName: string
): QuestionBank => {
  const workbook = XLSX.read(csvString, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const questions: Question[] = data
    .filter((row: any) => row.content && row.type)
    .map(convertImportRowToQuestion);

  const now = Date.now();
  return {
    id: generateId(),
    name: bankName,
    questions,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 从Excel导入题库
 */
export const importFromExcel = (
  buffer: ArrayBuffer,
  bankName: string
): QuestionBank => {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const questions: Question[] = data
    .filter((row: any) => row.content && row.type)
    .map(convertImportRowToQuestion);

  const now = Date.now();
  return {
    id: generateId(),
    name: bankName,
    questions,
    createdAt: now,
    updatedAt: now,
  };
};
