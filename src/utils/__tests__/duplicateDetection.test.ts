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

  it("returns an empty map for an empty question list", () => {
    expect(findDuplicateQuestions([])).toEqual(new Map());
  });

  it("returns an empty map when no questions share normalized content", () => {
    const questions = [
      makeQuestion("1", "What is React?"),
      makeQuestion("2", "What is Tauri?"),
      makeQuestion("3", "What is Next.js?"),
    ];
    expect(findDuplicateQuestions(questions).size).toBe(0);
  });

  it("groups three questions sharing the same normalized content into one entry", () => {
    const q1 = makeQuestion("1", "What is React.");
    const q2 = makeQuestion("2", "what is react");
    const q3 = makeQuestion("3", " WHAT IS REACT ");

    const duplicates = findDuplicateQuestions([q1, q2, q3]);

    expect(duplicates.size).toBe(1);
    expect(duplicates.get("what is react")).toEqual([q1, q2, q3]);
  });
});
