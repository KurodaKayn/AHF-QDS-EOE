import { parseQuestions } from "../questionParser";
import { QuestionType } from "@/types/quiz";

describe("parseQuestions", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses English single-choice questions with options and explanations", () => {
    const [question] = parseQuestions(`Single choice: Which option is correct?
A. Alpha
B. Beta
Answer: B
Explanation: Beta is the expected answer.`);

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

  it("parses Chinese multiple-choice answers separated by Chinese punctuation", () => {
    const [question] = parseQuestions(`多选题：请选择正确项
A. 选项一
B. 选项二
C. 选项三
答案：A，C`);

    expect(question.type).toBe(QuestionType.MultipleChoice);
    expect(question.answer).toEqual(["A", "C"]);
  });

  it("normalizes true/false answers", () => {
    const [question] = parseQuestions(`判断题：太阳从东方升起
答案：正确`);

    expect(question.type).toBe(QuestionType.TrueFalse);
    expect(question.answer).toBe("true");
  });
});
