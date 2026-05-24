import { QuestionBank, QuestionRecord } from "@/types/quiz";
import { invoke } from "@tauri-apps/api/core";

export interface QuizSnapshot {
  questionBanks: QuestionBank[];
  records: QuestionRecord[];
}

const isTauriRuntime =
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export async function loadQuizSnapshotFromBackend(): Promise<QuizSnapshot | null> {
  if (!isTauriRuntime) return null;
  return invoke<QuizSnapshot>("load_quiz_snapshot");
}

export async function replaceQuizSnapshotOnBackend(snapshot: QuizSnapshot): Promise<void> {
  if (!isTauriRuntime) return;
  await invoke("replace_quiz_snapshot", { snapshot });
}

export function hasQuizSnapshotData(snapshot: QuizSnapshot): boolean {
  return snapshot.questionBanks.length > 0 || snapshot.records.length > 0;
}
