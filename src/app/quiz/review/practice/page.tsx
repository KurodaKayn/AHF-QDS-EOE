"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/store/quizStore";
import { useTranslation } from "react-i18next";

export default function ReviewPracticePage() {
  const router = useRouter();
  const { questionBanks, records } = useQuizStore();
  const { t } = useTranslation();

  useEffect(() => {
    // Get wrong records
    const wrongRecords = records.filter((r) => !r.isCorrect);

    if (wrongRecords.length === 0) {
      // If no wrong questions, jump back to review page
      router.push("/quiz/review");
      return;
    }

    // Find the first bank with wrong questions
    const bankWithWrongQuestions = questionBanks.find((bank) =>
      bank.questions.some((q) =>
        wrongRecords.some((record) => record.questionId === q.id)
      )
    );

    if (bankWithWrongQuestions) {
      // Jump to normal practice page, but add param indicating review mode
      router.push(
        `/quiz/practice?bankId=${bankWithWrongQuestions.id}&mode=review`
      );
    } else {
      // If records exist but bank/questions not found
      router.push("/quiz/review");
    }
  }, [router, questionBanks, records]);

  return (
    <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600 dark:text-gray-400 mt-4">
        {t("practice.loadingQuestions")}
      </p>
    </div>
  );
}
