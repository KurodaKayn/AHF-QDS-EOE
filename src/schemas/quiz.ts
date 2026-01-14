import { z } from "zod";
import { QuestionType } from "@/types/quiz";
import i18n from "@/i18n/config";

/**
 * Question option validation schema
 */
export const questionOptionSchema = z.object({
  id: z
    .string()
    .min(
      1,
      i18n.t("questionForm.validation.optionIdRequired", {
        defaultValue: "Option ID is required",
      })
    ),
  content: z
    .string()
    .min(
      1,
      i18n.t("questionForm.validation.optionContentRequired", {
        defaultValue: "Option content is required",
      })
    ),
});

/**
 * Question validation schema
 */
export const questionSchema = z
  .object({
    id: z.string().optional(),
    type: z.nativeEnum(QuestionType, {
      message: i18n.t("questionForm.validation.invalidType", {
        defaultValue: "Invalid question type",
      }),
    }),
    content: z
      .string()
      .min(1, i18n.t("questionForm.validation.contentRequired")),
    options: z.array(questionOptionSchema).optional(),
    answer: z.union([z.string(), z.array(z.string())], {
      message: i18n.t("questionForm.validation.invalidAnswerFormat", {
        defaultValue: "Invalid answer format",
      }),
    }),
    explanation: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
  })
  .refine(
    (data) => {
      // Multiple choice and single choice must have options
      if (
        data.type === QuestionType.SingleChoice ||
        data.type === QuestionType.MultipleChoice
      ) {
        return data.options && data.options.length >= 2;
      }
      return true;
    },
    {
      message: i18n.t("questionForm.validation.minOptions", {
        defaultValue: "At least 2 options are required",
      }),
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      // Multiple choice answers must be an array
      if (data.type === QuestionType.MultipleChoice) {
        return Array.isArray(data.answer) && data.answer.length > 0;
      }
      return true;
    },
    {
      message: i18n.t("questionForm.validation.multipleAnswerRequired"),
      path: ["answer"],
    }
  )
  .refine(
    (data) => {
      // True/False answers must be 'true' or 'false'
      if (data.type === QuestionType.TrueFalse) {
        return data.answer === "true" || data.answer === "false";
      }
      return true;
    },
    {
      message: i18n.t("questionForm.validation.trueFalseRequired", {
        defaultValue: 'True/False answer must be "true" or "false"',
      }),
      path: ["answer"],
    }
  );

/**
 * Question bank validation schema
 */
export const questionBankSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, i18n.t("bankManage.alerts.bankNameRequired"))
    .max(
      100,
      i18n.t("bankManage.validation.nameTooLong", {
        defaultValue: "Bank name cannot exceed 100 characters",
      })
    ),
  description: z
    .string()
    .max(
      500,
      i18n.t("bankManage.validation.descTooLong", {
        defaultValue: "Description cannot exceed 500 characters",
      })
    )
    .optional(),
  questions: z.array(questionSchema).default([]),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

/**
 * Question record validation schema
 */
export const questionRecordSchema = z.object({
  id: z.string().optional(),
  questionId: z
    .string()
    .min(
      1,
      i18n.t("validation.questionIdRequired", {
        defaultValue: "Question ID is required",
      })
    ),
  userAnswer: z.union([z.string(), z.array(z.string())]),
  isCorrect: z.boolean(),
  answeredAt: z.number(),
});

/**
 * AI configuration validation schema
 */
export const aiConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["preset", "custom"]),
  provider: z.enum(["deepseek", "alibaba"]).optional(),
  baseUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
});

/**
 * Settings validation schema
 */
export const quizSettingsSchema = z.object({
  shufflePracticeOptions: z.boolean(),
  shuffleReviewOptions: z.boolean(),
  shufflePracticeQuestionOrder: z.boolean(),
  shuffleReviewQuestionOrder: z.boolean(),
  markMistakeAsCorrectedOnReviewSuccess: z.boolean(),

  aiConfigs: z.array(aiConfigSchema),
  activeAiConfigId: z.string(),

  checkDuplicateQuestion: z.boolean(),
});
