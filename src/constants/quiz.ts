import { QuestionType } from "@/types/quiz";

/**
 * Question type display names (Keys for i18n)
 */
export const QUESTION_TYPE_I18N_KEYS: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: "questionTypes.single-choice",
  [QuestionType.MultipleChoice]: "questionTypes.multiple-choice",
  [QuestionType.TrueFalse]: "questionTypes.true-false",
  [QuestionType.ShortAnswer]: "questionTypes.short-answer",
  [QuestionType.FillInBlank]: "questionTypes.fill-in-blank",
};

/**
 * Get question type name using translation function
 */
export const getQuestionTypeName = (type: QuestionType, t: any): string => {
  return t(QUESTION_TYPE_I18N_KEYS[type]);
};

/**
 * Legacy support for question type names (not recommended for new code)
 */
export const QUESTION_TYPE_NAMES: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: "Single Choice",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.TrueFalse]: "True/False",
  [QuestionType.ShortAnswer]: "Short Answer",
  [QuestionType.FillInBlank]: "Fill-in-Blank",
};

/**
 * Default question bank name
 */
export const DEFAULT_BANK_NAME = "Untitled Bank";

/**
 * Default export filename
 */
export const DEFAULT_EXPORT_FILENAME = "quiz_export";

/**
 * Example question text for demonstration
 */
export const EXAMPLE_QUESTION_TEXT = `1. Which of the following is NOT a primitive data type in JavaScript? ( )
A. String
B. Number
C. Array
D. Boolean
Correct Answer: C:Array;

2. Which JSP action tag is used to dynamically include another JSP page? ( )
A. jsp:forward
B. jsp:useBean
C. jsp:setProperty
D. jsp:include
Correct Answer: D:jsp:include;

3. In Java programming, ____ is an object-oriented language released by Sun in ____.
Correct Answer: Java;1995;`;

/**
 * Tag colors for UI
 */
export const TAG_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200",
  "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200",
  "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-200",
];

/**
 * Get color for a tag string
 */
export const getTagColor = (tag: string): string => {
  // Generate a stable index based on the string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash + tag.charCodeAt(i)) % TAG_COLORS.length;
  }
  return TAG_COLORS[hash];
};
