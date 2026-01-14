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
