import { nanoid } from "nanoid";
import * as XLSX from "xlsx";
import { Question, QuestionBank, QuestionType } from "@/types/quiz";

/**
 * Generates a unique ID
 */
export const generateId = (): string => nanoid();

/**
 * Creates an empty question bank
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
 * Creates a new question
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
 * Utility to convert question to export row format
 */
const convertQuestionToExportFormat = (q: Question): Record<string, any> => {
  // Format answer
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

  // Add options for choice questions
  if (q.options && q.options.length > 0) {
    q.options.forEach((opt, index) => {
      const optKey = `option${String.fromCharCode(65 + index)}`;
      baseRow[optKey] = opt.content;
    });
  }

  return baseRow;
};

/**
 * Exports question bank to CSV
 */
export const exportToCSV = (bank: QuestionBank): string => {
  const rows = bank.questions.map(convertQuestionToExportFormat);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(worksheet);
};

/**
 * Exports question bank to Excel
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
 * Utility to convert imported row data to question object
 */
const convertImportRowToQuestion = (row: any): Question => {
  const type = row.type as QuestionType;
  const content = row.content;

  // Process answers based on type
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

  // Find all option keys (optionA, optionB, etc.)
  const optionKeys = Object.keys(row).filter((key) =>
    /^option[A-Z]$/.test(key)
  );
  const options = optionKeys
    .filter((key) => {
      const val = row[key];
      return val !== null && val !== undefined && String(val).trim() !== "";
    })
    .map((key) => ({
      id: key.replace("option", ""), // Use option letter as ID (A, B, C...)
      content: String(row[key]),
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
 * Imports question bank from CSV string
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
 * Imports question bank from Excel buffer
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
