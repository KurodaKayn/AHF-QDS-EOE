import { invoke } from "@tauri-apps/api/core";
import { Question } from "@/types/quiz";

/**
 * Supported script template types.
 */
export enum ScriptTemplate {
  ChaoXing = "chaoxing",
  Other = "other",
  SingleChoice1 = "singlechoice1",
}

export async function parseTextByScript(
  text: string,
  template: ScriptTemplate = ScriptTemplate.Other,
): Promise<Question[]> {
  return invoke<Question[]>("parse_text_by_script", { text, template });
}
