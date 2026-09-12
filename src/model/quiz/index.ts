// Public Contracts & Entity Types
export { QuestionType, createEmptyBank, createQuestion } from "./quiz.contract";
export type {
  Question,
  QuestionBank,
  QuestionOption,
  QuestionRecord,
  WrongQuestionDisplay,
} from "./quiz.contract";

// Data Access API Facade
export { quizApi } from "./quiz.api";

// Store & State Hook
export { useQuizStore } from "./quiz.store";
export type { QuizSettings, QuizState } from "./quiz.store";

// Business Handlers & Practice Rules
export {
  checkIsCorrect,
  preparePracticeQuestions,
  calculateStats,
  PracticeHandlers,
} from "./quiz.grader";

// Parsing & Script Conversion
export { parseQuestions } from "./quiz.parser";
export { parseTextByScript, ScriptTemplate } from "./quiz.scriptParser";

// Query & Duplication Checks
export { findDuplicateQuestionsInBank, searchQuestionIds } from "./quiz.query";

// Answer normalization and display support
export { hasSelectedOption, resolveAnswerOptions, splitFillInBlankAnswers } from "./quiz.answer";

// Validation
export { questionSchema } from "./quiz.validator";
