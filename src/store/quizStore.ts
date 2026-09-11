/**
 * Quiz store re-export shim for backwards compatibility.
 * Re-exports public store and configuration types from domain modules.
 */
export { useQuizStore } from "@/model/quiz";
export type { QuizSettings, QuizState } from "@/model/quiz";
export type { AIConfig } from "@/model/ai";
