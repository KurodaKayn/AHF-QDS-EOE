import { invoke } from "@tauri-apps/api/core";
import { Question, QuestionOption, QuestionType } from "@/types/quiz";
import { generateId } from "@/utils/quiz";

const isTauriRuntime = () =>
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

interface ParsedOption extends QuestionOption {
  letter?: string;
}

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
  if (isTauriRuntime()) {
    return invoke<Question[]>("parse_text_by_script", { text, template });
  }

  return parseTextByScriptInBrowser(text, template);
}

function parseTextByScriptInBrowser(
  text: string,
  template: ScriptTemplate = ScriptTemplate.Other,
): Question[] {
  switch (template) {
    case ScriptTemplate.ChaoXing:
      return parseChaoXingTemplate(text);
    case ScriptTemplate.SingleChoice1:
      return parseSingleChoice1Template(text);
    case ScriptTemplate.Other:
    default:
      return parseOtherTemplate(text);
  }
}

function parseOtherTemplate(text: string): Question[] {
  const questions: Question[] = [];
  if (!text.trim()) {
    return questions;
  }

  const questionBlocks = text.trim().split(/\n\s*\n/);

  for (const block of questionBlocks) {
    const lines = block
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    if (lines.length < 3) continue;

    let questionContent = "";
    const parsedOptions: ParsedOption[] = [];
    let correctAnswerLetter: string | null = null;
    const questionType = QuestionType.SingleChoice;

    const questionLineMatch = lines[0].match(/^\d+\.\s*(.+?)(?:\s*\(\s*\))?$/);
    if (questionLineMatch && questionLineMatch[1]) {
      questionContent = questionLineMatch[1].trim();
    } else if (
      !lines[0].match(/^([A-Z])\.\s+/) &&
      !lines[0].match(/^(正确答案|Correct Answer):/i)
    ) {
      questionContent = lines[0];
    }

    if (!questionContent) continue;

    let answerLineFound = false;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optionMatch = line.match(/^([A-Z])\.\s+(.*)$/);
      if (optionMatch) {
        parsedOptions.push({
          id: generateId(),
          content: optionMatch[2].trim(),
          letter: optionMatch[1],
        });
        continue;
      }

      const answerMatch = line.match(/^(正确答案|Correct Answer):([A-Z])(?:[:：](.*?))?;?$/i);
      if (answerMatch) {
        correctAnswerLetter = answerMatch[2];
        answerLineFound = true;
        break;
      }
    }

    if (!answerLineFound || !correctAnswerLetter || parsedOptions.length === 0) continue;

    const finalOptions: QuestionOption[] = parsedOptions.map((opt) => ({
      id: opt.id,
      content: opt.content,
    }));
    const correctOption = parsedOptions.find((opt) => opt.letter === correctAnswerLetter);
    if (!correctOption) continue;

    const now = Date.now();
    questions.push({
      id: "",
      content: questionContent,
      type: questionType,
      options: finalOptions,
      answer: correctOption.id,
      explanation: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  return questions;
}

function parseChaoXingTemplate(text: string): Question[] {
  const questions: Question[] = [];
  if (!text.trim()) {
    return questions;
  }

  let cleanedText = text.replace(/\r\n/g, "\n").replace(/\n\s*\n/g, "\n");
  cleanedText = cleanedText.replace(/(AI讲解|AI Explanation)/g, "###AI_EXPLANATION###");

  const questionRegex1 = /(\d+\s*\.\s*\([^)]+\)[^]*?)(?=\d+\s*\.\s*\(|\s*###AI_EXPLANATION###|$)/g;
  const questionRegex2 =
    /(\d+\s*\.\s*[^]*?(?:我的答案|My Answer)[^]*?(?:正确答案|Correct Answer)[^]*?)(?=\d+\s*\.\s*|\s*###AI_EXPLANATION###|$)/g;
  const questionRegex3 =
    /(\d+\s*\.\s*[^]*?\d+\.?\d*(?:分|score)\s*)(?=\d+\s*\.\s*|\s*###AI_EXPLANATION###|$)/g;

  const matches1 = Array.from(cleanedText.matchAll(questionRegex1));
  const matches2 = Array.from(cleanedText.matchAll(questionRegex2));
  const matches3 = Array.from(cleanedText.matchAll(questionRegex3));

  let bestMatches = matches1;
  if (matches2.length > bestMatches.length) bestMatches = matches2;
  if (matches3.length > bestMatches.length) bestMatches = matches3;

  let questionBlocks: string[] =
    bestMatches.length > 0
      ? bestMatches.map((match) => match[1].trim())
      : cleanedText.split(/(?=\d+\s*\.\s*\()/);

  questionBlocks = questionBlocks.filter((block) => {
    return block.trim().length > 10 && /\d+\s*\.\s*/.test(block);
  });

  for (const questionBlock of questionBlocks) {
    const block = questionBlock.replace(/###AI_EXPLANATION###[^]*?(?=\d+\s*\.\s*|$)/g, "");
    if (!block.trim()) {
      continue;
    }

    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      continue;
    }

    let questionType: QuestionType;
    let questionContent = "";
    const questionTypeMatch = lines[0].match(/^\d+\s*\.\s*(?:\(([^)]+)\))?\s*(.+)$/);

    let firstOptionIndex = -1;
    for (let k = 1; k < lines.length; k++) {
      if (lines[k].match(/^A[.．]\s+/)) {
        firstOptionIndex = k;
        break;
      }
    }

    let extraContent = "";
    if (firstOptionIndex > 1) {
      for (let k = 1; k < firstOptionIndex; k++) {
        if (!lines[k].match(/(?:我的答案|My Answer|正确答案|Correct Answer|分|score)/i)) {
          extraContent += "\n" + lines[k];
        }
      }
    } else if (firstOptionIndex === -1) {
      for (let k = 1; k < lines.length; k++) {
        if (
          !lines[k].match(/^([A-Z])[.．]\s+/) &&
          !lines[k].match(/(?:我的答案|My Answer|正确答案|Correct Answer|分|score)/i)
        ) {
          extraContent += "\n" + lines[k];
        } else {
          break;
        }
      }
    }

    if (questionTypeMatch) {
      const typeText = questionTypeMatch[1] ? questionTypeMatch[1].toLowerCase() : "";
      questionContent = questionTypeMatch[2].trim() + extraContent;

      if (typeText.includes("填空") || typeText.includes("blank")) {
        questionType = QuestionType.FillInBlank;
      } else if (typeText.includes("单选") || typeText.includes("single")) {
        questionType = QuestionType.SingleChoice;
      } else if (typeText.includes("多选") || typeText.includes("multiple")) {
        questionType = QuestionType.MultipleChoice;
      } else if (
        typeText.includes("判断") ||
        typeText.includes("true") ||
        typeText.includes("false")
      ) {
        questionType = QuestionType.TrueFalse;
      } else if (block.includes("A.") || block.includes("A．") || block.match(/\([A-D]\)/)) {
        questionType = block.match(/(?:正确答案|Correct Answer)[:：]\s*[A-D][,，、\s]*[A-D]/i)
          ? QuestionType.MultipleChoice
          : QuestionType.SingleChoice;
      } else if (
        block.includes("判断") ||
        block.match(/(?:正确答案|Correct Answer)[:：]\s*(?:对|错|true|false)/i)
      ) {
        questionType = QuestionType.TrueFalse;
      } else if (
        block.includes("____") ||
        block.includes("填空") ||
        block.toLowerCase().includes("fill")
      ) {
        questionType = QuestionType.FillInBlank;
      } else {
        questionType = QuestionType.SingleChoice;
      }
    } else {
      const basicMatch = lines[0].match(/^\d+\s*\.\s*(.+)$/);
      questionContent = basicMatch ? basicMatch[1].trim() + extraContent : lines[0] + extraContent;

      if (lines.some((line) => line.match(/^[A-D][.．]/) || line.match(/\([A-D]\)/))) {
        const multiAnswer = lines.some(
          (line) =>
            line.match(/(?:正确答案|Correct Answer)[:：]\s*[A-D][,，、\s][A-D]/i) ||
            line.match(/(?:正确答案|Correct Answer)[:：]\s*\[[A-D][,，、\s][A-D]\]/i),
        );

        questionType = multiAnswer ? QuestionType.MultipleChoice : QuestionType.SingleChoice;
      } else if (
        lines.some(
          (line) =>
            line.includes("判断") ||
            line.match(/(?:正确答案|Correct Answer)[:：]\s*(?:对|错|true|false)/i),
        )
      ) {
        questionType = QuestionType.TrueFalse;
      } else if (
        questionContent.includes("____") ||
        lines.some((line) => line.includes("填空") || line.toLowerCase().includes("fill"))
      ) {
        questionType = QuestionType.FillInBlank;
      } else {
        questionType = QuestionType.SingleChoice;
      }
    }

    if (!questionContent) {
      continue;
    }

    if (questionType === QuestionType.FillInBlank) {
      let correctAnswer = "";

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();
        if (line.match(/(?:正确答案|Correct Answer)[:：]/i)) {
          const anyMatch = line.match(
            /(?:正确答案|Correct Answer)[:：]\s*(?:\(?(?:\d+)\)?)?\s*(.+)/i,
          );
          if (anyMatch && anyMatch[1]) {
            correctAnswer = anyMatch[1].trim();
            break;
          }
        }
      }

      const multipleAnswers = correctAnswer
        .split(/[;；]/)
        .map((answer) => answer.trim())
        .filter(Boolean);

      const now = Date.now();
      questions.push({
        id: "",
        content: questionContent,
        type: questionType,
        options: [],
        answer: multipleAnswers.length === 1 ? multipleAnswers[0] : multipleAnswers.join(";"),
        explanation: "",
        tags: [],
        createdAt: now,
        updatedAt: now,
      });
      continue;
    }

    const parsedOptions: ParsedOption[] = [];
    let correctAnswerLetter: string | null = null;

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      const optionMatch = line.match(/^([A-Z])\.\s+(.*)$/);
      if (optionMatch) {
        parsedOptions.push({
          id: generateId(),
          content: optionMatch[2].trim(),
          letter: optionMatch[1],
        });
        continue;
      }

      const answerMatch = line.match(/.*(?:正确答案|Correct Answer)[:：]\s*([A-Z])/i);

      if (answerMatch) {
        correctAnswerLetter = answerMatch[1].toUpperCase();
        break;
      } else if (line.match(/(?:正确答案|Correct Answer)[:：]\s*(?:对|错|true|false)/i)) {
        const isTrue = line.match(/(?:对|true)/i);
        correctAnswerLetter = isTrue ? "A" : "B";
        if (parsedOptions.length === 0 && questionType === QuestionType.TrueFalse) {
          parsedOptions.push({
            id: generateId(),
            content: "对/True",
            letter: "A",
          });
          parsedOptions.push({
            id: generateId(),
            content: "错/False",
            letter: "B",
          });
        }
        break;
      }
    }

    if (!correctAnswerLetter) {
      continue;
    }

    if (questionType === QuestionType.TrueFalse && parsedOptions.length === 0) {
      parsedOptions.push({ id: generateId(), content: "对/True", letter: "A" });
      parsedOptions.push({
        id: generateId(),
        content: "错/False",
        letter: "B",
      });
    }

    if (parsedOptions.length === 0) {
      continue;
    }

    const finalOptions: QuestionOption[] = parsedOptions.map((opt) => ({
      id: opt.id,
      content: opt.content,
    }));
    let questionAnswer: string | string[] = "";

    if (questionType === QuestionType.MultipleChoice) {
      const answerLine = lines.find((line) => line.match(/(?:正确答案|Correct Answer)[:：]/i));
      if (answerLine) {
        const letters = answerLine.match(/(?:正确答案|Correct Answer)[:：]\s*([A-Z,，、\s]+)/i);
        if (letters) {
          const letterStr = letters[1].toUpperCase();
          const extractedLetters = letterStr
            .split(/[,，、\s]/)
            .flatMap((letter) => letter.split(""));
          questionAnswer = extractedLetters
            .map((letter) => {
              const option = parsedOptions.find((opt) => opt.letter === letter.trim());
              return option ? option.id : "";
            })
            .filter(Boolean);
        }
      }

      if (Array.isArray(questionAnswer) && questionAnswer.length === 0) {
        continue;
      }
    } else {
      const correctOption = parsedOptions.find((opt) => opt.letter === correctAnswerLetter);
      if (correctOption) {
        questionAnswer = correctOption.id;
      } else {
        continue;
      }
    }

    const now = Date.now();
    questions.push({
      id: "",
      content: questionContent,
      type: questionType,
      options: finalOptions,
      answer: questionAnswer,
      explanation: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  return questions;
}

function parseSingleChoice1Template(text: string): Question[] {
  const questions: Question[] = [];
  if (!text.trim()) return questions;

  enum State {
    None,
    Question,
    Option,
    Answer,
  }
  let state = State.None;

  const seqReg = /^\s*(\d+)\./;
  const optReg = /^([A-EＡ-Ｅ])[.．]\s*(.*)$/;
  const ansReg = /(?:参考答案|Reference Answer)[:：]?\s*([A-EＡ-Ｅ])/i;
  const inlineOptReg = /([A-EＡ-Ｅ])[.．]\s*([^A-EＡ-Ｅ]*)/g;

  const toHalf = (ch: string) =>
    String.fromCharCode(ch.charCodeAt(0) > 127 ? ch.charCodeAt(0) - 65248 : ch.charCodeAt(0));

  const lines = text.replace(/\r\n/g, "\n").split("\n");

  let bufferQuestion = "";
  let bufferOption = "";
  let bufferOptionLetter = "";
  let bufferOptions: ParsedOption[] = [];
  let bufferAnswer = "";

  function pushQuestion() {
    if (!bufferQuestion.trim() || bufferOptions.length === 0 || !bufferAnswer) return;
    const now = Date.now();
    questions.push({
      id: "",
      content: bufferQuestion.trim(),
      type: QuestionType.SingleChoice,
      options: bufferOptions
        .filter((opt) => !!opt.letter)
        .map((opt) => ({
          id: opt.letter as string,
          content: opt.content.trim(),
        })),
      answer: bufferAnswer,
      explanation: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const seqMatch = line.match(seqReg);
    if (seqMatch) {
      if (bufferQuestion && bufferOptions.length && bufferAnswer) {
        pushQuestion();
      }
      bufferQuestion = "";
      bufferOptions = [];
      bufferOption = "";
      bufferOptionLetter = "";
      bufferAnswer = "";
      state = State.Question;
      const afterSeq = line.replace(seqReg, "").trim();
      const firstOptIdx = afterSeq.search(/([A-EＡ-Ｅ])[.．]/);
      if (firstOptIdx !== -1) {
        bufferQuestion = afterSeq.substring(0, firstOptIdx).trim();
        const optStr = afterSeq.substring(firstOptIdx);
        const optMatches = Array.from(optStr.matchAll(inlineOptReg));
        for (let j = 0; j < optMatches.length; j++) {
          const match = optMatches[j];
          const letter = toHalf(match[1]);
          const content = match[2].trim();
          const nextStart = j < optMatches.length - 1 ? optMatches[j + 1].index : optStr.length;
          const fullContent = optStr.substring(match.index! + match[0].length, nextStart).trim();
          const optionContent = (content + " " + fullContent).replace(/\s+/g, " ").trim();
          bufferOptions.push({
            id: letter,
            letter,
            content: optionContent,
          });
        }
        state = State.Option;
        continue;
      }

      bufferQuestion = afterSeq;
      continue;
    }

    const optMatch = line.match(optReg);
    if (optMatch) {
      if (bufferOptionLetter) {
        bufferOptions.push({
          id: bufferOptionLetter,
          letter: bufferOptionLetter,
          content: bufferOption.trim(),
        });
      }
      bufferOptionLetter = toHalf(optMatch[1]);
      bufferOption = optMatch[2].trim();
      state = State.Option;
      continue;
    }

    const ansMatch = line.match(ansReg);
    if (ansMatch) {
      if (bufferOptionLetter) {
        bufferOptions.push({
          id: bufferOptionLetter,
          letter: bufferOptionLetter,
          content: bufferOption.trim(),
        });
        bufferOptionLetter = "";
        bufferOption = "";
      }
      bufferAnswer = toHalf(ansMatch[1]);
      state = State.Answer;
      continue;
    }

    if (state === State.Question) {
      bufferQuestion += " " + line;
    } else if (state === State.Option) {
      bufferOption += " " + line;
    }
  }

  if (bufferQuestion && bufferOptions.length && bufferAnswer) {
    pushQuestion();
  }
  return questions;
}
