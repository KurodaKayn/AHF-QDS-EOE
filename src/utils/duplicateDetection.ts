import { Question } from "@/types/quiz";

/**
 * Normalizes text by removing specific punctuation and converting to lowercase
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[()（）。.]/g, "") // Remove brackets, periods, etc.
    .trim();
};

/**
 * Finds duplicate questions based on normalized content
 * Returns a map where keys are normalized content and values are arrays of duplicate questions
 */
export const findDuplicateQuestions = (
  questions: Question[]
): Map<string, Question[]> => {
  const normalizedMap = new Map<string, Question[]>();
  const duplicates = new Map<string, Question[]>();

  // Step 1: Group questions by normalized text
  questions.forEach((question) => {
    const normalizedContent = normalizeText(question.content);
    if (!normalizedMap.has(normalizedContent)) {
      normalizedMap.set(normalizedContent, []);
    }
    normalizedMap.get(normalizedContent)?.push(question);
  });

  // Step 2: Find groups with duplicates
  normalizedMap.forEach((group, normalizedContent) => {
    if (group.length > 1) {
      duplicates.set(normalizedContent, group);
    }
  });

  return duplicates;
};
