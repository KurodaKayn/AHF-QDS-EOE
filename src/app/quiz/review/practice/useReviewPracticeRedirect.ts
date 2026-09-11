import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { useTranslation } from "react-i18next";

/**
 * Hook to handle auto-redirection to the first question bank with wrong questions.
 * Co-located with ReviewPracticePage.
 */
export function useReviewPracticeRedirect() {
  const router = useRouter();
  const { questionBanks, records } = useQuizStore();
  const { t } = useTranslation();

  useEffect(() => {
    const wrongRecords = records.filter((r) => !r.isCorrect);

    if (wrongRecords.length === 0) {
      router.push("/quiz/review");
      return;
    }

    const bankWithWrongQuestions = questionBanks.find((bank) =>
      bank.questions.some((q) => wrongRecords.some((record) => record.questionId === q.id)),
    );

    if (bankWithWrongQuestions) {
      router.push(`/quiz/practice?bankId=${bankWithWrongQuestions.id}&mode=review`);
    } else {
      router.push("/quiz/review");
    }
  }, [router, questionBanks, records]);

  return { t };
}
