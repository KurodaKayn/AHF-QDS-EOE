import { parseQuestions } from "../questionParser";
import { QuestionType } from "@/types/quiz";

describe("parseQuestions", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("parses English short answer questions and extracts the answer line", () => {
    const [question] = parseQuestions(`Short answer: What is pnpm?
Answer: A fast package manager`);

    expect(question).toMatchObject({
      type: QuestionType.ShortAnswer,
      content: "What is pnpm?",
      answer: "A fast package manager",
    });
  });

  it("parses fill-in-blank with English keyword and replaces parenthesised placeholder with blanks", () => {
    const [question] = parseQuestions(`Fill in the blank: The runtime is (Node.js).
Answer: Node.js`);

    expect(question).toMatchObject({
      type: QuestionType.FillInBlank,
      content: "The runtime is ____.",
      answer: "Node.js",
    });
  });

  it("parses Chinese fill-in-blank and normalizes a false True/False answer", () => {
    const [fillInBlank, trueFalse] = parseQuestions(`填空题：包管理器是____
答案：pnpm

判断题：太阳从西方升起
答案：错误`);

    expect(fillInBlank).toMatchObject({
      type: QuestionType.FillInBlank,
      content: "包管理器是____",
      answer: "pnpm",
    });
    expect(trueFalse).toMatchObject({
      type: QuestionType.TrueFalse,
      answer: "false",
    });
  });
});
