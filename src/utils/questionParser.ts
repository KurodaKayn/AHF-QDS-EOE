import { Question, QuestionType, QuestionOption } from "@/types/quiz";
import { v4 as uuidv4 } from "uuid";

/**
 * 解析 AI 返回的文本，转换为题目对象数组
 * 支持多行选项内容（如代码块）
 */
export const parseQuestions = (text: string): Omit<Question, "id">[] => {
  const questions: Omit<Question, "id">[] = [];
  // 拆分为每个题目块
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
      let explanation: string = "";

      // 检测题目类型
      if (lines[0].includes("单选题：")) {
        questionType = QuestionType.SingleChoice;
        content = lines[0].replace(/^单选题：/, "").trim();
        const result = parseOptions(lines, 1);
        options = result.options;
        answer = findAnswer(lines, result.options, questionType);
      } else if (lines[0].includes("多选题：")) {
        questionType = QuestionType.MultipleChoice;
        content = lines[0].replace(/^多选题：/, "").trim();
        const result = parseOptions(lines, 1);
        options = result.options;
        answer = findAnswer(lines, result.options, questionType);
      } else if (lines[0].includes("判断题：")) {
        questionType = QuestionType.TrueFalse;
        content = lines[0].replace(/^判断题：/, "").trim();
        answer = parseTrueFalseAnswer(lines);
      } else if (lines[0].includes("简答题：")) {
        questionType = QuestionType.ShortAnswer;
        content = lines[0].replace(/^简答题：/, "").trim();
        const answerIndex = lines.findIndex((line) =>
          line.startsWith("答案：")
        );
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^答案：/, "").trim();
        }
      } else if (lines[0].includes("填空题：")) {
        questionType = QuestionType.FillInBlank;
        content = lines[0].replace(/^填空题：/, "").trim();
        if (!content.includes("____") && !content.includes("_____")) {
          content = content.replace(/\(([^)]+)\)/g, "____");
        }
        const answerIndex = lines.findIndex((line) =>
          line.startsWith("答案：")
        );
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^答案：/, "").trim();
        }
      } else {
        // 自动判断类型
        const hasOptions = lines.some((line) => /^[A-Za-z]\./.test(line));
        const hasFillBlank =
          lines[0].includes("____") || lines[0].includes("_____");

        if (hasFillBlank) {
          questionType = QuestionType.FillInBlank;
        } else if (hasOptions) {
          const answerLine = lines.find((line) => line.startsWith("答案："));
          questionType =
            answerLine && answerLine.includes(",")
              ? QuestionType.MultipleChoice
              : QuestionType.SingleChoice;
        } else {
          const answerLine = lines.find((line) => line.startsWith("答案："));
          if (answerLine) {
            const answerText = answerLine.replace(/^答案：/, "").trim();
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

        // 处理选项
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
          const answerLine = lines.find((line) => line.startsWith("答案："));
          if (answerLine) {
            answer = answerLine.replace(/^答案：/, "").trim();
          }
        } else {
          const answerIndex = lines.findIndex((line) =>
            line.startsWith("答案：")
          );
          if (answerIndex >= 0) {
            answer = lines[answerIndex].replace(/^答案：/, "").trim();
          }
        }
      }

      // 解析解析
      const explanationIndex = lines.findIndex((line) =>
        line.startsWith("解析：")
      );
      if (explanationIndex >= 0) {
        explanation = lines[explanationIndex].replace(/^解析：/, "").trim();
      }

      questions.push({
        content,
        type: questionType,
        options:
          questionType === QuestionType.SingleChoice ||
          questionType === QuestionType.MultipleChoice
            ? options
            : [],
        answer,
        explanation,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("解析题目出错:", error);
    }
  }

  return questions;
};

/**
 * 解析选项 - 支持多行内容
 */
function parseOptions(
  lines: string[],
  startIndex: number
): { options: QuestionOption[] } {
  const options: QuestionOption[] = [];
  let currentOption: { id: string; content: string } | null = null;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    // 检查是否是答案行或解析行
    if (line.startsWith("答案：") || line.startsWith("解析：")) {
      // 保存当前选项
      if (currentOption) {
        options.push(currentOption);
        currentOption = null;
      }
      break;
    }

    // 检查是否是新选项的开始
    const optionMatch = line.match(/^([A-Za-z])\.(.*)$/);
    if (optionMatch) {
      // 保存前一个选项
      if (currentOption) {
        options.push(currentOption);
      }
      // 开始新选项
      const optionId = optionMatch[1].toUpperCase();
      const optionContent = optionMatch[2].trim();
      currentOption = {
        id: optionId,
        content: optionContent,
      };
    } else if (currentOption) {
      // 这是当前选项的续行（多行内容）
      currentOption.content += "\n" + line;
    }
  }

  // 保存最后一个选项
  if (currentOption) {
    options.push(currentOption);
  }

  return { options };
}

/**
 * 查找答案
 */
function findAnswer(
  lines: string[],
  options: QuestionOption[],
  questionType: QuestionType
): string | string[] {
  const answerLine = lines.find((line) => line.startsWith("答案："));
  if (!answerLine) return "";

  const answerText = answerLine.replace(/^答案：/, "").trim();

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

/**
 * 解析判断题答案
 */
function parseTrueFalseAnswer(lines: string[]): string {
  const answerLine = lines.find((line) => line.startsWith("答案："));
  if (!answerLine) return "";

  const answerText = answerLine.replace(/^答案：/, "").trim();
  if (["对", "正确", "TRUE", "True", "true"].includes(answerText)) {
    return "true";
  } else if (["错", "错误", "FALSE", "False", "false"].includes(answerText)) {
    return "false";
  }

  return "";
}
