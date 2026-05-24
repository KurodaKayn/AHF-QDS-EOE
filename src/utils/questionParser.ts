import { invoke } from "@tauri-apps/api/core";
import { Question, QuestionOption, QuestionType } from "@/types/quiz";

const isTauriRuntime = () =>
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

/**
 * Parses text into an array of question objects.
 * Supports multi-line option content (e.g., code blocks).
 * Handles both Chinese and English keywords.
 */
export async function parseQuestions(text: string): Promise<Question[]> {
  if (isTauriRuntime()) {
    return invoke<Question[]>("parse_questions", { text });
  }

  return parseQuestionsInBrowser(text);
}

function parseQuestionsInBrowser(text: string): Question[] {
  const questions: Question[] = [];
  const questionBlocks = text.split(/\n\s*\n+/).filter((block) => block.trim());

  for (const block of questionBlocks) {
    try {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2) continue;

      let questionType: QuestionType;
      let content: string;
      let options: QuestionOption[] = [];
      let answer: string | string[] = "";
      let explanation = "";

      const firstLine = lines[0];

      if (firstLine.includes("单选题：") || firstLine.toLowerCase().includes("single choice:")) {
        questionType = QuestionType.SingleChoice;
        content = firstLine.replace(/^(单选题：|single choice:)/i, "").trim();
        const result = parseOptions(lines, 1);
        options = result.options;
        answer = findAnswer(lines, result.options, questionType);
      } else if (
        firstLine.includes("多选题：") ||
        firstLine.toLowerCase().includes("multiple choice:")
      ) {
        questionType = QuestionType.MultipleChoice;
        content = firstLine.replace(/^(多选题：|multiple choice:)/i, "").trim();
        const result = parseOptions(lines, 1);
        options = result.options;
        answer = findAnswer(lines, result.options, questionType);
      } else if (
        firstLine.includes("判断题：") ||
        firstLine.toLowerCase().includes("true/false:") ||
        firstLine.toLowerCase().includes("true-false:")
      ) {
        questionType = QuestionType.TrueFalse;
        content = firstLine.replace(/^(判断题：|true\/false:|true-false:)/i, "").trim();
        answer = parseTrueFalseAnswer(lines);
      } else if (
        firstLine.includes("简答题：") ||
        firstLine.toLowerCase().includes("short answer:")
      ) {
        questionType = QuestionType.ShortAnswer;
        content = firstLine.replace(/^(简答题：|short answer:)/i, "").trim();
        const answerIndex = lines.findIndex((line) => /^ (答案：|answer:)/i.test(" " + line));
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^(答案：|answer:)/i, "").trim();
        }
      } else if (
        firstLine.includes("填空题：") ||
        firstLine.toLowerCase().includes("fill in the blank:") ||
        firstLine.toLowerCase().includes("fill in blank:")
      ) {
        questionType = QuestionType.FillInBlank;
        content = firstLine.replace(/^(填空题：|fill in the blank:|fill in blank:)/i, "").trim();
        if (!content.includes("____") && !content.includes("_____")) {
          content = content.replace(/\(([^)]+)\)/g, "____");
        }
        const answerIndex = lines.findIndex((line) => /^ (答案：|answer:)/i.test(" " + line));
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^(答案：|answer:)/i, "").trim();
        }
      } else {
        const hasOptions = lines.some((line) => /^[A-Za-z]\./.test(line));
        const hasFillBlank = lines[0].includes("____") || lines[0].includes("_____");

        if (hasFillBlank) {
          questionType = QuestionType.FillInBlank;
        } else if (hasOptions) {
          const answerLine = lines.find((line) => /^ (答案：|answer:)/i.test(" " + line));
          questionType =
            answerLine && (answerLine.includes(",") || answerLine.includes("，"))
              ? QuestionType.MultipleChoice
              : QuestionType.SingleChoice;
        } else {
          const answerLine = lines.find((line) => /^ (答案：|answer:)/i.test(" " + line));
          if (answerLine) {
            const answerText = answerLine.replace(/^(答案：|answer:)/i, "").trim();
            if (
              [
                "对",
                "错",
                "正确",
                "错误",
                "TRUE",
                "True",
                "true",
                "FALSE",
                "False",
                "false",
                "Correct",
                "Incorrect",
              ].includes(answerText)
            ) {
              questionType = QuestionType.TrueFalse;
            } else {
              questionType = QuestionType.ShortAnswer;
            }
          } else {
            questionType = QuestionType.ShortAnswer;
          }
        }

        content = lines[0].trim();

        if (
          questionType === QuestionType.SingleChoice ||
          questionType === QuestionType.MultipleChoice
        ) {
          const result = parseOptions(lines, 0);
          options = result.options;
          answer = findAnswer(lines, result.options, questionType);
        } else if (questionType === QuestionType.TrueFalse) {
          answer = parseTrueFalseAnswer(lines);
        } else if (questionType === QuestionType.FillInBlank) {
          const answerLine = lines.find((line) => /^ (答案：|answer:)/i.test(" " + line));
          if (answerLine) {
            answer = answerLine.replace(/^(答案：|answer:)/i, "").trim();
          }
        } else {
          const answerIndex = lines.findIndex((line) => /^ (答案：|answer:)/i.test(" " + line));
          if (answerIndex >= 0) {
            answer = lines[answerIndex].replace(/^(答案：|answer:)/i, "").trim();
          }
        }
      }

      const explanationIndex = lines.findIndex((line) =>
        /^ (解析：|explanation:)/i.test(" " + line),
      );
      if (explanationIndex >= 0) {
        explanation = lines[explanationIndex].replace(/^(解析：|explanation:)/i, "").trim();
      }

      questions.push({
        id: "",
        content,
        type: questionType,
        options:
          questionType === QuestionType.SingleChoice || questionType === QuestionType.MultipleChoice
            ? options
            : [],
        answer,
        explanation,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch {
      // Ignore parsing errors for individual blocks.
    }
  }

  return questions;
}

function parseOptions(lines: string[], startIndex: number): { options: QuestionOption[] } {
  const options: QuestionOption[] = [];
  let currentOption: { id: string; content: string } | null = null;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    if (/^ (答案：|answer:|解析：|explanation:)/i.test(" " + line)) {
      if (currentOption) {
        options.push(currentOption);
        currentOption = null;
      }
      break;
    }

    const optionMatch = line.match(/^([A-Za-z])\.(.*)$/);
    if (optionMatch) {
      if (currentOption) {
        options.push(currentOption);
      }
      currentOption = {
        id: optionMatch[1].toUpperCase(),
        content: optionMatch[2].trim(),
      };
    } else if (currentOption) {
      currentOption.content += "\n" + line;
    }
  }

  if (currentOption) {
    options.push(currentOption);
  }

  return { options };
}

function findAnswer(
  lines: string[],
  options: QuestionOption[],
  questionType: QuestionType,
): string | string[] {
  const answerLine = lines.find((line) => /^ (答案：|answer:)/i.test(" " + line));
  if (!answerLine) return "";

  const answerText = answerLine.replace(/^(答案：|answer:)/i, "").trim();

  if (questionType === QuestionType.SingleChoice) {
    const answerMatch = answerText.match(/([A-Za-z])/);
    if (answerMatch) {
      const letter = answerMatch[1].toUpperCase();
      const option = options.find((opt) => opt.id === letter);
      return option ? option.id : letter;
    }
  } else if (questionType === QuestionType.MultipleChoice) {
    const letters = answerText
      .split(/[\s,，、]+/)
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean);
    return letters
      .map((letter) => {
        const option = options.find((opt) => opt.id === letter);
        return option ? option.id : letter;
      })
      .filter(Boolean);
  }

  return "";
}

function parseTrueFalseAnswer(lines: string[]): string {
  const answerLine = lines.find((line) => /^ (答案：|answer:)/i.test(" " + line));
  if (!answerLine) return "";

  const answerText = answerLine
    .replace(/^(答案：|answer:)/i, "")
    .trim()
    .toLowerCase();
  const trueKeywords = ["对", "正确", "true", "correct"];
  const falseKeywords = ["错", "错误", "false", "incorrect"];

  if (trueKeywords.includes(answerText)) {
    return "true";
  } else if (falseKeywords.includes(answerText)) {
    return "false";
  }

  return "";
}
