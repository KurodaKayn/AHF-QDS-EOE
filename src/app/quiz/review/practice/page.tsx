"use client";

import { useReviewPracticeRedirect } from "./useReviewPracticeRedirect";

/**
 * Review Practice Redirection Page
 * Focuses purely on UI presentation; navigation logic is in useReviewPracticeRedirect.
 */
export default function ReviewPracticePage() {
  const { t } = useReviewPracticeRedirect();

  return (
    <div className="dark:bg-gray-900 min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600 dark:text-gray-400 mt-4">{t("practice.loadingQuestions")}</p>
    </div>
  );
}
