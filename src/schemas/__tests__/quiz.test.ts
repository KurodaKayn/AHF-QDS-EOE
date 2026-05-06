import { questionBankSchema, questionOptionSchema, questionSchema } from "../quiz";
import { QuestionType } from "@/types/quiz";

describe("quiz schemas", () => {
  it("accepts a valid single-choice question", () => {
    expect(
      questionSchema.safeParse({
        type: QuestionType.SingleChoice,
        content: "Which is correct?",
        options: [
          { id: "A", content: "Alpha" },
          { id: "B", content: "Beta" },
        ],
        answer: "A",
        tags: ["tag"],
      }).success,
    ).toBe(true);
  });

  it("rejects invalid question shapes", () => {
    expect(
      questionSchema.safeParse({
        type: QuestionType.MultipleChoice,
        content: "Choose",
        options: [{ id: "A", content: "Alpha" }],
        answer: "A",
      }).success,
    ).toBe(false);

    expect(
      questionSchema.safeParse({
        type: QuestionType.TrueFalse,
        content: "Is this true?",
        answer: "maybe",
      }).success,
    ).toBe(false);
  });

  it("validates bank and option fields", () => {
    expect(
      questionOptionSchema.safeParse({
        id: "A",
        content: "Alpha",
      }).success,
    ).toBe(true);

    expect(
      questionOptionSchema.safeParse({
        id: "",
        content: "",
      }).success,
    ).toBe(false);

    expect(
      questionBankSchema.safeParse({
        name: "Quiz Bank",
        description: "desc",
        questions: [],
      }).success,
    ).toBe(true);

    expect(
      questionBankSchema.safeParse({
        name: "",
        questions: [],
      }).success,
    ).toBe(false);
  });
});
