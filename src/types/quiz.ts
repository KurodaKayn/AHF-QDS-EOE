/**
 * 题目类型枚举
 */
export enum QuestionType {
  SingleChoice = 'single-choice', // 单选题
  MultipleChoice = 'multiple-choice', // 多选题
  TrueFalse = 'true-false', // 判断题
  ShortAnswer = 'short-answer', // 简答题
}

/**
 * 题目选项类型
 */
export interface QuestionOption {
  id: string;
  content: string;
}

/**
 * 题目类型
 */
export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  answer: string | string[]; // 单选题/判断题为字符串，多选题为字符串数组, 简答题为字符串
  explanation?: string; // 解析
  tags?: string[]; // 标签，用于分类
  createdAt: number;
  updatedAt: number;
}

/**
 * 题库类型
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
 * 用户答题记录
 */
export interface QuestionRecord {
  id?: string;
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  answeredAt: number;
}

/**
 * API密钥配置
 */
export interface ApiKeyConfig {
  deepseek: string;
}