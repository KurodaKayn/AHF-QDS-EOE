import { findDuplicateQuestions, normalizeText } from "../duplicateDetection";
import { Question, QuestionType } from "@/types/quiz";

const makeQuestion = (id: string, content: string): Question => ({
  id,
  content,
  type: QuestionType.ShortAnswer,
  answer: "",
  createdAt: 1,
  updatedAt: 1,
});

describe("duplicateDetection", () => {
  it("normalizes case and common punctuation", () => {
    expect(normalizeText(" Hello（World）. ")).toBe("helloworld");
  });

  it("groups questions by normalized duplicate content", () => {
    const duplicateA = makeQuestion("1", "What is React.");
    const duplicateB = makeQuestion("2", "what is react");
    const unique = makeQuestion("3", "What is Tauri?");

    const duplicates = findDuplicateQuestions([duplicateA, duplicateB, unique]);

    expect(duplicates.size).toBe(1);
    expect(duplicates.get("what is react")).toEqual([duplicateA, duplicateB]);
  });
});
