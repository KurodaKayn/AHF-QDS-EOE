import { Question } from "@/types/quiz";
import { findDuplicateQuestions } from "@/utils/duplicateDetection";
import { normalizeText } from "@/utils/duplicateDetection";
import { invoke } from "@tauri-apps/api/core";

interface DuplicateQuestionGroup {
  normalizedContent: string;
  questionIds: string[];
}

const isTauriRuntime = () =>
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export async function findDuplicateQuestionsInBank(
  bankId: string,
  questions: Question[],
): Promise<Map<string, Question[]>> {
  if (!isTauriRuntime()) {
    return findDuplicateQuestions(questions);
  }

  const groups = await invoke<DuplicateQuestionGroup[]>("find_duplicate_question_groups", {
    bankId,
  });
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const duplicateMap = new Map<string, Question[]>();

  groups.forEach((group) => {
    const items = group.questionIds
      .map((id) => questionById.get(id))
      .filter((question): question is Question => Boolean(question));
    if (items.length > 1) {
      duplicateMap.set(group.normalizedContent, items);
    }
  });

  return duplicateMap;
}

export async function searchQuestionIds(query: string): Promise<Set<string> | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (!isTauriRuntime()) {
    return null;
  }

  const ids = await invoke<string[]>("search_questions", {
    request: { query: normalizeText(trimmed) },
  });
  return new Set(ids);
}
