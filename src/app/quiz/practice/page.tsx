"use client";

import { Suspense } from "react";
import { PracticeContent } from "@/components/quiz/practice/PracticeContent";
import { useTranslation } from "react-i18next";

/**
 * Quiz practice page
 * Wrapped in Suspense to support useSearchParams in client components
 */
function PracticePageContent() {
  return <PracticeContent />;
}

export default function PracticePage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg">{t("common.loading")}</div>
        </div>
      }
    >
      <PracticePageContent />
    </Suspense>
  );
}
