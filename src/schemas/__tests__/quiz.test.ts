import {
  aiConfigSchema,
  questionBankSchema,
  questionOptionSchema,
  questionRecordSchema,
  questionSchema,
} from "../quiz";
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

  it("accepts valid FillInBlank and ShortAnswer questions without options", () => {
    expect(
      questionSchema.safeParse({
        type: QuestionType.FillInBlank,
        content: "The runtime is ____.",
        answer: "Node.js",
      }).success,
    ).toBe(true);

    expect(
      questionSchema.safeParse({
        type: QuestionType.ShortAnswer,
        content: "Explain React?",
        answer: "A JavaScript library for building UIs",
      }).success,
    ).toBe(true);
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

  it("rejects bank names over 100 characters and descriptions over 500 characters", () => {
    expect(
      questionBankSchema.safeParse({
        name: "A".repeat(101),
        questions: [],
      }).success,
    ).toBe(false);

    expect(
      questionBankSchema.safeParse({
        name: "Valid Name",
        description: "D".repeat(501),
        questions: [],
      }).success,
    ).toBe(false);
  });

  it("validates question records", () => {
    expect(
      questionRecordSchema.safeParse({
        questionId: "q-1",
        userAnswer: "A",
        isCorrect: true,
        answeredAt: 1700000000000,
      }).success,
    ).toBe(true);

    expect(
      questionRecordSchema.safeParse({
        questionId: "",
        userAnswer: "A",
        isCorrect: true,
        answeredAt: 1700000000000,
      }).success,
    ).toBe(false);
  });

  it("validates AI configurations", () => {
    expect(
      aiConfigSchema.safeParse({
        id: "config-1",
        name: "DeepSeek",
        type: "preset",
        provider: "deepseek",
        baseUrl: "https://api.deepseek.com",
        apiKey: "key",
        model: "deepseek-chat",
      }).success,
    ).toBe(true);

    expect(
      aiConfigSchema.safeParse({
        id: "config-1",
        name: "Bad Config",
        type: "invalid-type",
        baseUrl: "https://example.com",
        apiKey: "key",
        model: "model",
      }).success,
    ).toBe(false);
  });
});
