import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore } from "@/model/quiz";
import { formatDistanceToNow } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

/**
 * Hook encapsulating dashboard state, timer refreshes, and navigation logic.
 * Co-located with QuizPage.
 */
export function useQuizDashboard() {
  const router = useRouter();
  const { questionBanks, practiceSession, getQuestionBankById } = useQuizStore();
  const { t, i18n } = useTranslation();

  // Force refresh the list every minute to keep date-fns relative times updated
  const [_, setForceUpdate] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getDateLocale = () => {
    return i18n.language === "en" ? enUS : zhCN;
  };

  const hasUnfinishedSession =
    practiceSession.bankId &&
    practiceSession.practiceQuestions.length > 0 &&
    !practiceSession.quizCompleted;

  const unfinishedBank = hasUnfinishedSession ? getQuestionBankById(practiceSession.bankId!) : null;

  const handleContinuePractice = () => {
    if (practiceSession.bankId) {
      const mode = practiceSession.mode === "review" ? "&mode=review" : "";
      router.push(`/quiz/practice?bankId=${practiceSession.bankId}${mode}`);
    }
  };

  const handleStartPractice = (bankId: string) => {
    router.push(`/quiz/practice?bankId=${bankId}`);
  };

  const handleManageBank = (bankId?: string) => {
    const param = bankId ? `?bankId=${bankId}` : "";
    if (process.env.NODE_ENV === "development") {
      router.push(`/quiz/banks/manage${param}`);
    } else {
      const form = document.createElement("form");
      form.method = "GET";
      form.action = "/quiz/banks/manage/index.html";
      if (bankId) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "bankId";
        input.value = bankId;
        form.appendChild(input);
      }
      form.style.display = "none";
      document.body.appendChild(form);
      form.submit();
    }
  };

  const formatUpdatedAt = (timestamp: number) => {
    return formatDistanceToNow(timestamp, {
      addSuffix: true,
      locale: getDateLocale(),
    });
  };

  return {
    t,
    questionBanks,
    hasUnfinishedSession,
    unfinishedBank,
    practiceSession,
    handleContinuePractice,
    handleStartPractice,
    handleManageBank,
    formatUpdatedAt,
  };
}
