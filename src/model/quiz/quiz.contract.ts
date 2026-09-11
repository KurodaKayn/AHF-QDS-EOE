import { generateId } from "@/lib/id";

/**
 * Question type enum
 */
export enum QuestionType {
  SingleChoice = "single-choice",
  MultipleChoice = "multiple-choice",
  TrueFalse = "true-false",
  ShortAnswer = "short-answer",
  FillInBlank = "fill-in-blank",
}

/**
 * Question option structure
 */
export interface QuestionOption {
  id: string;
  content: string;
}

/**
 * Question structure
 */
export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  answer: string | string[]; // String for single choice/true-false/short answer, array for multiple choice
  explanation?: string; // Explanation for the answer
  tags?: string[]; // Tags for categorization
  createdAt: number;
  updatedAt: number;
}

/**
 * Question bank structure
 */
export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

/**
 * User answering record
 */
export interface QuestionRecord {
  id?: string;
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  answeredAt: number;
}

/**
 * API Key configuration
 */
export interface ApiKeyConfig {
  deepseek: string;
}

/**
 * Wrong question display data structure
 */
export interface WrongQuestionDisplay extends Question {
  bankId: string;
  bankName: string;
  userAnswer: string | string[];
  answeredAt: number;
}

export interface QuizSnapshot {
  questionBanks: QuestionBank[];
  records: QuestionRecord[];
}

export interface BankMutationResult {
  bank: QuestionBank | null;
  snapshot: QuizSnapshot;
}

export interface QuestionMutationResult {
  question: Question | null;
  isDuplicate: boolean;
  snapshot: QuizSnapshot;
}

export interface BatchQuestionMutationResult {
  addedCount: number;
  duplicateCount: number;
  snapshot: QuizSnapshot;
}

export interface DuplicateQuestionGroup {
  normalizedContent: string;
  questionIds: string[];
}

export interface QuestionInput {
  type: string;
  content: string;
  options?: Array<{ id: string; content: string }>;
  answer: string | string[];
  explanation?: string;
  tags?: string[];
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Creates an empty question bank
 */
export const createEmptyBank = (name: string, description?: string): QuestionBank => {
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
  tags: string[] = [],
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
