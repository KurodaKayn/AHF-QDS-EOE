import { QuestionType } from "@/types/quiz";

const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("parseTextByScript", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_INTERNALS__;
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates script parsing to the Rust backend inside Tauri", async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    mockInvoke.mockResolvedValue([
      {
        id: "question-1",
        content: "包管理器是____",
        type: QuestionType.FillInBlank,
        options: [],
        answer: "pnpm",
        explanation: "",
        tags: [],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ]);

    const { parseTextByScript, ScriptTemplate } = await import("../scriptParser");
    const questions = await parseTextByScript(
      "1. (填空题) 包管理器是____",
      ScriptTemplate.ChaoXing,
    );

    expect(mockInvoke).toHaveBeenCalledWith("parse_text_by_script", {
      text: "1. (填空题) 包管理器是____",
      template: ScriptTemplate.ChaoXing,
    });
    expect(questions[0]).toMatchObject({
      type: QuestionType.FillInBlank,
      answer: "pnpm",
    });
  });

  it("falls back to browser parsing when Tauri IPC is unavailable", async () => {
    const { parseTextByScript, ScriptTemplate } = await import("../scriptParser");
    const [question] = await parseTextByScript(
      `1. Which tool runs the tests?
A. npm
B. pnpm
Correct Answer:B`,
      ScriptTemplate.Other,
    );

    expect(mockInvoke).not.toHaveBeenCalled();
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

  it("falls back for ChaoXing multiple-choice and fill-in-blank parsing", async () => {
    const { parseTextByScript, ScriptTemplate } = await import("../scriptParser");
    const [multipleChoice, fillInBlank] = await parseTextByScript(
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
});
