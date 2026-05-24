import { QuestionType } from "@/types/quiz";

const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("parseQuestions", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    delete (window as any).__TAURI__;
    delete (window as any).__TAURI_INTERNALS__;
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates AI response parsing to the Rust backend inside Tauri", async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    mockInvoke.mockResolvedValue([
      {
        id: "question-1",
        content: "Which option is correct?",
        type: QuestionType.SingleChoice,
        options: [
          { id: "A", content: "Alpha" },
          { id: "B", content: "Beta" },
        ],
        answer: "B",
        explanation: "Beta is the expected answer.",
        tags: [],
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ]);

    const { parseQuestions } = await import("../questionParser");
    const questions = await parseQuestions("Single choice: Which option is correct?");

    expect(mockInvoke).toHaveBeenCalledWith("parse_questions", {
      text: "Single choice: Which option is correct?",
    });
    expect(questions[0]).toMatchObject({
      type: QuestionType.SingleChoice,
      answer: "B",
    });
  });

  it("falls back to browser parsing when Tauri IPC is unavailable", async () => {
    const { parseQuestions } = await import("../questionParser");
    const [question] = await parseQuestions(`Single choice: Which option is correct?
A. Alpha
B. Beta
Answer: B
Explanation: Beta is the expected answer.`);

    expect(mockInvoke).not.toHaveBeenCalled();
    expect(question).toMatchObject({
      content: "Which option is correct?",
      type: QuestionType.SingleChoice,
      answer: "B",
      explanation: "Beta is the expected answer.",
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });
    expect(question.options).toEqual([
      { id: "A", content: "Alpha" },
      { id: "B", content: "Beta" },
    ]);
  });
});
