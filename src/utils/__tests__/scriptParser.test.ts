import { parseTextByScript, ScriptTemplate } from "../scriptParser";
import { QuestionType } from "@/types/quiz";

describe("parseTextByScript", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses the generic template and maps answer letters to generated option ids", () => {
    const [question] = parseTextByScript(
      `1. Which tool runs the tests?
A. npm
B. pnpm
Correct Answer:B`,
      ScriptTemplate.Other,
    );

    expect(question).toMatchObject({
      content: "Which tool runs the tests?",
      type: QuestionType.SingleChoice,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });
    expect(question.options).toHaveLength(2);
    expect(question.options?.map((option) => option.content)).toEqual(["npm", "pnpm"]);
    expect(question.answer).toBe(question.options?.[1].id);
  });

  it("parses ChaoXing multiple-choice and fill-in-blank answers", () => {
    const [multipleChoice, fillInBlank] = parseTextByScript(
      `1. (多选题) 选择项目技术
A. Next.js
B. Tauri
C. Photoshop
正确答案：A，B

2. (填空题) 包管理器是____
正确答案：pnpm；npm`,
      ScriptTemplate.ChaoXing,
    );

    expect(multipleChoice.type).toBe(QuestionType.MultipleChoice);
    expect(multipleChoice.options?.map((option) => option.content)).toEqual([
      "Next.js",
      "Tauri",
      "Photoshop",
    ]);
    expect(multipleChoice.answer).toEqual([
      multipleChoice.options?.[0].id,
      multipleChoice.options?.[1].id,
    ]);

    expect(fillInBlank).toMatchObject({
      content: "包管理器是____",
      type: QuestionType.FillInBlank,
      options: [],
      answer: "pnpm;npm",
    });
  });

  it("parses compact single-choice templates with inline full-width options", () => {
    const [question] = parseTextByScript(
      `1. 哪个框架用于桌面壳？Ａ．Electron Ｂ．Tauri
参考答案：Ｂ`,
      ScriptTemplate.SingleChoice1,
    );

    expect(question).toMatchObject({
      content: "哪个框架用于桌面壳？",
      type: QuestionType.SingleChoice,
      answer: "B",
      options: [
        { id: "A", content: "Electron" },
        { id: "B", content: "Tauri" },
      ],
    });
  });
});
