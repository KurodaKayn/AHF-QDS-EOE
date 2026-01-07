import { Question, QuestionType, QuestionOption } from "@/types/quiz";
import { v4 as uuidv4 } from "uuid";

/**
 * 解析 AI 返回的文本，转换为题目对象数组
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
      if (lines.length < 2) continue; // 至少需要题目和答案两行

      let questionType: QuestionType;
      let content: string;
      let options: QuestionOption[] = [];
      let answer: string | string[] = "";
      let explanation: string = "";

      // 检测题目类型
      if (lines[0].includes("单选题：")) {
        questionType = QuestionType.SingleChoice;
        content = lines[0].replace(/^单选题：/, "").trim();

        // 解析选项
        const optionLines = lines.filter((line) => /^[A-Za-z]\./.test(line));
        options = optionLines.map((line) => {
          const match = line.match(/^([A-Za-z])\.(.+)$/);
          if (!match) return { id: uuidv4(), content: line };
          const optionId = match[1].toUpperCase();
          return { id: optionId, content: match[2].trim() };
        });

        // 解析答案
        const answerLine = lines.find((line) => line.startsWith("答案："));
        if (answerLine) {
          const answerMatch = answerLine.match(/答案：([A-Za-z])/);
          if (answerMatch) {
            answer = answerMatch[1].toUpperCase();
          }
        }
      } else if (lines[0].includes("多选题：")) {
        questionType = QuestionType.MultipleChoice;
        content = lines[0].replace(/^多选题：/, "").trim();

        // 解析选项
        const optionLines = lines.filter((line) => /^[A-Za-z]\./.test(line));
        options = optionLines.map((line) => {
          const match = line.match(/^([A-Za-z])\.(.+)$/);
          if (!match) return { id: uuidv4(), content: line };
          const optionId = match[1].toUpperCase();
          return { id: optionId, content: match[2].trim() };
        });

        // 解析答案
        const answerLine = lines.find((line) => line.startsWith("答案："));
        if (answerLine) {
          const answerText = answerLine.replace(/^答案：/, "").trim();
          answer = answerText
            .split(/[\s,，、]+/)
            .map((a) => a.trim().toUpperCase())
            .filter(Boolean);
        }
      } else if (lines[0].includes("判断题：")) {
        questionType = QuestionType.TrueFalse;
        content = lines[0].replace(/^判断题：/, "").trim();

        // 解析答案
        const answerLine = lines.find((line) => line.startsWith("答案："));
        if (answerLine) {
          const answerText = answerLine.replace(/^答案：/, "").trim();
          if (["对", "正确", "TRUE", "True", "true"].includes(answerText)) {
            answer = "true";
          } else if (
            ["错", "错误", "FALSE", "False", "false"].includes(answerText)
          ) {
            answer = "false";
          }
        }
      } else if (lines[0].includes("简答题：")) {
        questionType = QuestionType.ShortAnswer;
        content = lines[0].replace(/^简答题：/, "").trim();

        // 解析答案
        const answerIndex = lines.findIndex((line) =>
          line.startsWith("答案：")
        );
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^答案：/, "").trim();
        }
      } else if (lines[0].includes("填空题：")) {
        questionType = QuestionType.FillInBlank;
        content = lines[0].replace(/^填空题：/, "").trim();

        // 确保题目内容包含填空符号
        if (!content.includes("____") && !content.includes("_____")) {
          content = content.replace(/\(([^)]+)\)/g, "____"); // 把括号中的内容替换为填空符
        }

        // 解析答案
        const answerIndex = lines.findIndex((line) =>
          line.startsWith("答案：")
        );
        if (answerIndex >= 0) {
          answer = lines[answerIndex].replace(/^答案：/, "").trim();
        }
      } else {
        // 尝试自动判断类型
        const hasOptions = lines.some((line) => /^[A-Za-z]\./.test(line));
        const hasFillBlank =
          lines[0].includes("____") || lines[0].includes("_____"); // 检查是否包含填空符号

        if (hasFillBlank) {
          questionType = QuestionType.FillInBlank;
        } else if (hasOptions) {
          // 检查是否为多选
          const answerLine = lines.find((line) => line.startsWith("答案："));
          if (answerLine && answerLine.includes(",")) {
            questionType = QuestionType.MultipleChoice;
          } else {
            questionType = QuestionType.SingleChoice;
          }
        } else {
          // 判断是否为判断题
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
            // 默认为短答题
            questionType = QuestionType.ShortAnswer;
          }
        }

        content = lines[0].trim();

        // 根据类型处理选项和答案
        if (
          questionType === QuestionType.SingleChoice ||
          questionType === QuestionType.MultipleChoice
        ) {
          // 解析选项
          const optionLines = lines.filter((line) => /^[A-Za-z]\./.test(line));
          options = optionLines.map((line) => {
            const match = line.match(/^([A-Za-z])\.(.+)$/);
            if (!match) return { id: uuidv4(), content: line };
            const optionId = match[1].toUpperCase();
            return { id: optionId, content: match[2].trim() };
          });

          // 解析答案
          const answerLine = lines.find((line) => line.startsWith("答案："));
          if (answerLine) {
            const answerText = answerLine.replace(/^答案：/, "").trim();
            if (questionType === QuestionType.SingleChoice) {
              const answerMatch = answerText.match(/([A-Za-z])/);
              if (answerMatch) {
                answer = answerMatch[1].toUpperCase();
              }
            } else {
              answer = answerText
                .split(/[\s,，、]+/)
                .map((a) => a.trim().toUpperCase())
                .filter(Boolean);
            }
          }
        } else if (questionType === QuestionType.TrueFalse) {
          // 解析答案
          const answerLine = lines.find((line) => line.startsWith("答案："));
          if (answerLine) {
            const answerText = answerLine.replace(/^答案：/, "").trim();
            if (["对", "正确", "TRUE", "True", "true"].includes(answerText)) {
              answer = "true";
            } else if (
              ["错", "错误", "FALSE", "False", "false"].includes(answerText)
            ) {
              answer = "false";
            }
          }
        } else if (questionType === QuestionType.FillInBlank) {
          // 解析填空题答案
          const answerLine = lines.find((line) => line.startsWith("答案："));
          if (answerLine) {
            answer = answerLine.replace(/^答案：/, "").trim();
          }
        } else {
          // ShortAnswer
          // 解析答案
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
      // 继续处理下一个题目块
    }
  }

  return questions;
};
