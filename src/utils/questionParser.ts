import { invoke } from "@tauri-apps/api/core";
import { Question } from "@/types/quiz";

export async function parseQuestions(text: string): Promise<Question[]> {
  return invoke<Question[]>("parse_questions", { text });
}
