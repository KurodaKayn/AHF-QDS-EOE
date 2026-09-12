import type { Question } from "@/model/quiz";

export type QuestionSaveResult = { success: true } | { success: false; message?: string };

export type SaveQuestion = (
  bankId: string,
  questionData: Omit<Question, "id">,
  questionId?: string,
) => Promise<QuestionSaveResult>;
