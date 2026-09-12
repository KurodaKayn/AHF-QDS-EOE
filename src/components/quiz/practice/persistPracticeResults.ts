import { PracticeHandlers, type Question, type QuestionRecord } from "@/model/quiz";

type PracticeQuestion = Question & { originalUserAnswer?: string | string[] };

interface PersistPracticeResultsOptions {
  questions: PracticeQuestion[];
  userAnswers: Record<string, string | string[]>;
  isReviewMode: boolean;
  removeCorrectedMistakes: boolean;
  addRecord: (record: Omit<QuestionRecord, "id">) => Promise<void>;
  removeWrongRecordsByQuestionId: (questionId: string) => Promise<void>;
}

/** Persists the completed session in question order and preserves review semantics. */
export async function persistPracticeResults({
  questions,
  userAnswers,
  isReviewMode,
  removeCorrectedMistakes,
  addRecord,
  removeWrongRecordsByQuestionId,
}: PersistPracticeResultsOptions): Promise<void> {
  for (const question of questions) {
    const userAnswer = userAnswers[question.id];
    const isCorrect = PracticeHandlers.checkIsCorrect(question, userAnswer);

    await addRecord({
      questionId: question.id,
      userAnswer: userAnswer || "",
      isCorrect,
      answeredAt: Date.now(),
    });

    if (isReviewMode && isCorrect && removeCorrectedMistakes) {
      await removeWrongRecordsByQuestionId(question.id);
    }
  }
}
