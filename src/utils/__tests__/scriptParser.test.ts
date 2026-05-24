import { QuestionType } from "@/types/quiz";

const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("parseTextByScript", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("delegates script parsing to the Rust backend", async () => {
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
});
