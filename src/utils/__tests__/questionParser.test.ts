import { QuestionType } from "@/types/quiz";

const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("parseQuestions", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("delegates AI response parsing to the Rust backend", async () => {
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
});
