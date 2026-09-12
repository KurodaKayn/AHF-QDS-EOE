import { QuestionType } from "./quiz.contract";

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

    const { parseQuestions } = await import("./quiz.parser");
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
    const { parseQuestions } = await import("./quiz.parser");
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

  it("parses multiple choice answers across contiguous, delimiter-separated, and full-width formats", async () => {
    const { parseQuestions } = await import("./quiz.parser");

    // Case 1: Contiguous letters "AB"
    const [q1] = await parseQuestions(`Multiple choice: Select prime numbers
A. 2
B. 3
C. 4
Answer: AB
Explanation: 2 and 3 are prime.`);
    expect(q1.type).toBe(QuestionType.MultipleChoice);
    expect(q1.answer).toEqual(["A", "B"]);

    // Case 2: Comma separated "A, C"
    const [q2] = await parseQuestions(`多选题：选择偶数
A. 2
B. 3
C. 4
答案：A, C
解析：2和4是偶数。`);
    expect(q2.type).toBe(QuestionType.MultipleChoice);
    expect(q2.answer).toEqual(["A", "C"]);

    // Case 3: Chinese enumeration mark "B、C"
    const [q3] = await parseQuestions(`多选题：选择大于2的数
A. 2
B. 3
C. 4
答案：B、C`);
    expect(q3.type).toBe(QuestionType.MultipleChoice);
    expect(q3.answer).toEqual(["B", "C"]);

    // Case 4: Full-width characters "ＡＢ"
    const [q4] = await parseQuestions(`多选题：全角测试
A. 第一项
B. 第二项
C. 第三项
答案：ＡＢ`);
    expect(q4.type).toBe(QuestionType.MultipleChoice);
    expect(q4.answer).toEqual(["A", "B"]);
  });
});
