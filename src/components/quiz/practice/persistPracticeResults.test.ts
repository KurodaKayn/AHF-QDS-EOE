import { QuestionType } from "@/model/quiz";
import { persistPracticeResults } from "./persistPracticeResults";

describe("persistPracticeResults", () => {
  it("records every answer and clears corrected review mistakes", async () => {
    const addRecord = vi.fn().mockResolvedValue(undefined);
    const removeWrongRecordsByQuestionId = vi.fn().mockResolvedValue(undefined);
    await persistPracticeResults({
      questions: [
        {
          id: "q-1",
          type: QuestionType.SingleChoice,
          content: "Question",
          options: [],
          answer: "A",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      userAnswers: { "q-1": "A" },
      isReviewMode: true,
      removeCorrectedMistakes: true,
      addRecord,
      removeWrongRecordsByQuestionId,
    });

    expect(addRecord).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: "q-1", isCorrect: true }),
    );
    expect(removeWrongRecordsByQuestionId).toHaveBeenCalledWith("q-1");
  });
});
