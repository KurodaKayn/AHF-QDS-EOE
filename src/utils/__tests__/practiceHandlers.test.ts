import { PracticeHandlers } from "../practiceHandlers";
import { Question, QuestionType } from "@/types/quiz";

const makeQuestion = (
  type: QuestionType,
  answer: string | string[],
  overrides: Partial<Question> = {},
): Question => ({
  id: "q-1",
  type,
  content: "Question",
  answer,
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe("PracticeHandlers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checks answers according to each question type", () => {
    expect(PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.SingleChoice, "A"), "a")).toBe(
      true,
    );
    expect(
      PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.MultipleChoice, ["A", "C"]), [
        "C",
        "A",
      ]),
    ).toBe(true);
    expect(
      PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.MultipleChoice, ["A", "C"]), ["A"]),
    ).toBe(false);
    expect(
      PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.FillInBlank, "pnpm; npm"), "NPM"),
    ).toBe(true);
    expect(
      PracticeHandlers.checkIsCorrect(
        makeQuestion(QuestionType.ShortAnswer, "Next.js"),
        " next.js ",
      ),
    ).toBe(true);
  });

  it("prepares practice questions without mutating the originals", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const questions = [
      makeQuestion(QuestionType.SingleChoice, "A", {
        id: "q-1",
        options: [
          { id: "A", content: "Alpha" },
          { id: "B", content: "Beta" },
          { id: "C", content: "Gamma" },
        ],
      }),
      makeQuestion(QuestionType.TrueFalse, "true", {
        id: "q-2",
        options: [
          { id: "true", content: "True" },
          { id: "false", content: "False" },
        ],
      }),
    ];

    const prepared = PracticeHandlers.preparePracticeQuestions(questions, {
      shuffleQuestionOrder: true,
      shuffleOptions: true,
    });

    expect(prepared.map((q) => q.id)).toEqual(["q-2", "q-1"]);
    expect(prepared[1].options?.map((option) => option.id)).toEqual(["B", "C", "A"]);
    expect(questions[0].options?.map((option) => option.id)).toEqual(["A", "B", "C"]);
    expect(prepared[0].options?.map((option) => option.id)).toEqual(["true", "false"]);
  });

  it("handles TrueFalse answers case-insensitively and returns false for undefined", () => {
    expect(
      PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.TrueFalse, "false"), "FALSE"),
    ).toBe(true);
    expect(
      PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.TrueFalse, "true"), "false"),
    ).toBe(false);
    expect(
      PracticeHandlers.checkIsCorrect(makeQuestion(QuestionType.TrueFalse, "true"), undefined),
    ).toBe(false);
  });

  it("does not shuffle TrueFalse options even when shuffleOptions is enabled", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const q = makeQuestion(QuestionType.TrueFalse, "true", {
      id: "q-1",
      options: [
        { id: "true", content: "True" },
        { id: "false", content: "False" },
      ],
    });

    const [prepared] = PracticeHandlers.preparePracticeQuestions([q], {
      shuffleQuestionOrder: false,
      shuffleOptions: true,
    });

    expect(prepared.options?.map((o) => o.id)).toEqual(["true", "false"]);
  });

  it("returns zero accuracy and zero answered count when no answers are submitted", () => {
    const questions = [
      makeQuestion(QuestionType.SingleChoice, "A", { id: "q-1" }),
      makeQuestion(QuestionType.ShortAnswer, "React", { id: "q-2" }),
    ];

    expect(PracticeHandlers.calculateStats(questions, {})).toEqual({
      totalQuestions: 2,
      correctCount: 0,
      wrongCount: 0,
      unansweredCount: 2,
      answeredCount: 0,
      accuracy: 0,
    });
  });

  it("calculates answered, unanswered, wrong, and accuracy statistics", () => {
    const questions = [
      makeQuestion(QuestionType.SingleChoice, "A", { id: "q-1" }),
      makeQuestion(QuestionType.ShortAnswer, "React", { id: "q-2" }),
      makeQuestion(QuestionType.MultipleChoice, ["A", "B"], { id: "q-3" }),
    ];

    expect(
      PracticeHandlers.calculateStats(questions, {
        "q-1": "a",
        "q-2": "Vue",
      }),
    ).toEqual({
      totalQuestions: 3,
      correctCount: 1,
      wrongCount: 1,
      unansweredCount: 1,
      answeredCount: 2,
      accuracy: 50,
    });
  });
});
