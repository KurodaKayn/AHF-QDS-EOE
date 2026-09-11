import { invoke } from "@tauri-apps/api/core";
import type {
  BankMutationResult,
  BatchQuestionMutationResult,
  DuplicateQuestionGroup,
  Question,
  QuestionInput,
  QuestionMutationResult,
  QuizSnapshot,
} from "./quiz.contract";

/**
 * Data access API for Quiz domain.
 * Manages all direct backend interactions (Tauri commands / SQLite).
 */
export const quizApi = {
  loadSnapshot: (): Promise<QuizSnapshot> => invoke<QuizSnapshot>("load_quiz_snapshot"),

  replaceSnapshot: (snapshot: QuizSnapshot): Promise<void> =>
    invoke<void>("replace_quiz_snapshot", { snapshot }),

  createBank: (name: string, description?: string): Promise<BankMutationResult> =>
    invoke<BankMutationResult>("create_question_bank", { name, description }),

  updateBank: (id: string, name: string, description?: string): Promise<BankMutationResult> =>
    invoke<BankMutationResult>("update_question_bank", { id, name, description }),

  deleteBank: (id: string): Promise<QuizSnapshot> =>
    invoke<QuizSnapshot>("delete_question_bank", { id }),

  addQuestionToBank: (
    bankId: string,
    question: QuestionInput,
    checkDuplicate = false,
  ): Promise<QuestionMutationResult> =>
    invoke<QuestionMutationResult>("add_question_to_bank", {
      bankId,
      question,
      checkDuplicate,
    }),

  batchAddQuestionsToBank: (
    bankId: string,
    questions: QuestionInput[],
    checkDuplicate = false,
  ): Promise<BatchQuestionMutationResult> =>
    invoke<BatchQuestionMutationResult>("batch_add_questions_to_bank", {
      bankId,
      questions,
      checkDuplicate,
    }),

  updateQuestionInBank: (
    bankId: string,
    questionId: string,
    question: QuestionInput,
  ): Promise<QuestionMutationResult> =>
    invoke<QuestionMutationResult>("update_question_in_bank", {
      bankId,
      questionId,
      question,
    }),

  deleteQuestionFromBank: (bankId: string, questionId: string): Promise<QuizSnapshot> =>
    invoke<QuizSnapshot>("delete_question_from_bank", { bankId, questionId }),

  addQuestionRecord: (record: {
    id?: string;
    questionId: string;
    userAnswer: unknown;
    isCorrect: boolean;
    answeredAt: number;
  }): Promise<QuizSnapshot> => invoke<QuizSnapshot>("add_question_record", { record }),

  clearQuestionRecords: (bankId?: string): Promise<QuizSnapshot> =>
    invoke<QuizSnapshot>("clear_question_records", { bankId }),

  removeWrongRecordsByQuestionId: (questionId: string): Promise<QuizSnapshot> =>
    invoke<QuizSnapshot>("remove_wrong_records_by_question_id", { questionId }),

  findDuplicateQuestionGroups: (bankId: string): Promise<DuplicateQuestionGroup[]> =>
    invoke<DuplicateQuestionGroup[]>("find_duplicate_question_groups", { bankId }),

  searchQuestions: (query: string): Promise<string[]> =>
    invoke<string[]>("search_questions", { request: { query } }),

  parseQuestions: (text: string): Promise<Question[]> =>
    invoke<Question[]>("parse_questions", { text }),

  parseTextByScript: (text: string, template: string): Promise<Question[]> =>
    invoke<Question[]>("parse_text_by_script", { text, template }),
};

export async function loadQuizSnapshotFromBackend(): Promise<QuizSnapshot | null> {
  const { isTauriRuntime } = await import("@/lib/runtime");
  if (!isTauriRuntime()) return null;
  return quizApi.loadSnapshot();
}

export async function replaceQuizSnapshotOnBackend(snapshot: QuizSnapshot): Promise<void> {
  const { isTauriRuntime } = await import("@/lib/runtime");
  if (!isTauriRuntime()) return;
  await quizApi.replaceSnapshot(snapshot);
}

export function hasQuizSnapshotData(snapshot: QuizSnapshot): boolean {
  return snapshot.questionBanks.length > 0 || snapshot.records.length > 0;
}
