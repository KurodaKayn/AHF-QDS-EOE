import { z } from 'zod';
import { QuestionType } from '@/types/quiz';

/**
 * 题目选项验证 schema
 */
export const questionOptionSchema = z.object({
  id: z.string().min(1, '选项ID不能为空'),
  content: z.string().min(1, '选项内容不能为空'),
});

/**
 * 题目验证 schema
 */
export const questionSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(QuestionType, {
    message: '无效的题目类型',
  }),
  content: z.string().min(1, '题目内容不能为空'),
  options: z.array(questionOptionSchema).optional(),
  answer: z.union([z.string(), z.array(z.string())], {
    message: '答案格式不正确',
  }),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
}).refine(
  (data) => {
    // 单选题和多选题必须有选项
    if (data.type === QuestionType.SingleChoice || data.type === QuestionType.MultipleChoice) {
      return data.options && data.options.length >= 2;
    }
    return true;
  },
  {
    message: '选择题至少需要2个选项',
    path: ['options'],
  }
).refine(
  (data) => {
    // 多选题答案必须是数组
    if (data.type === QuestionType.MultipleChoice) {
      return Array.isArray(data.answer) && data.answer.length > 0;
    }
    return true;
  },
  {
    message: '多选题答案必须是数组且不能为空',
    path: ['answer'],
  }
).refine(
  (data) => {
    // 判断题答案必须是 'true' 或 'false'
    if (data.type === QuestionType.TrueFalse) {
      return data.answer === 'true' || data.answer === 'false';
    }
    return true;
  },
  {
    message: '判断题答案必须是 "true" 或 "false"',
    path: ['answer'],
  }
);

/**
 * 题库验证 schema
 */
export const questionBankSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '题库名称不能为空').max(100, '题库名称不能超过100个字符'),
  description: z.string().max(500, '题库描述不能超过500个字符').optional(),
  questions: z.array(questionSchema).default([]),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

/**
 * 答题记录验证 schema
 */
export const questionRecordSchema = z.object({
  id: z.string().optional(),
  questionId: z.string().min(1, '题目ID不能为空'),
  userAnswer: z.union([z.string(), z.array(z.string())]),
  isCorrect: z.boolean(),
  answeredAt: z.number(),
});

/**
 * 设置验证 schema
 */
export const quizSettingsSchema = z.object({
  shufflePracticeOptions: z.boolean(),
  shuffleReviewOptions: z.boolean(),
  shufflePracticeQuestionOrder: z.boolean(),
  shuffleReviewQuestionOrder: z.boolean(),
  markMistakeAsCorrectedOnReviewSuccess: z.boolean(),
  aiProvider: z.enum(['deepseek', 'alibaba']),
  deepseekApiKey: z.string(),
  deepseekBaseUrl: z.string().url('DeepSeek API地址格式不正确').or(z.literal('')),
  alibabaApiKey: z.string(),
  checkDuplicateQuestion: z.boolean(),
});
