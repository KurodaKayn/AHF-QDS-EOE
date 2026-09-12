import type { Question, QuestionOption } from "./quiz.contract";

/**
 * Splits acceptable fill-in-the-blank answers. A doubled semicolon is an
 * escaped literal semicolon, while a single semicolon separates answers.
 */
export function splitFillInBlankAnswers(answer: string): string[] {
  return answer
    .split(/(?<!;);(?!;)/)
    .map((item) => item.replace(/;;/g, ";").trim())
    .filter(Boolean);
}

/** Resolves persisted option IDs and legacy option letters to their options. */
export function resolveAnswerOptions(
  options: QuestionOption[] | undefined,
  answer: string | string[] | undefined,
): QuestionOption[] {
  if (!options || answer === undefined) return [];

  const values = Array.isArray(answer) ? answer : [answer];
  return values
    .map((value) => {
      const byId = options.find((option) => option.id === value);
      if (byId) return byId;

      const index = value.length === 1 ? value.toUpperCase().charCodeAt(0) - 65 : -1;
      return index >= 0 && index < options.length ? options[index] : undefined;
    })
    .filter((option): option is QuestionOption => Boolean(option));
}

export function hasSelectedOption(
  question: Pick<Question, "options">,
  answer: string | string[] | undefined,
  optionId: string,
): boolean {
  return resolveAnswerOptions(question.options, answer).some((option) => option.id === optionId);
}
