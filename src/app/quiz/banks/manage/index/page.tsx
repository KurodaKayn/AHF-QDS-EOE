"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function ManageBankIndexRedirect() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Redirect to parent directory
      router.replace("/quiz/banks/manage/");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>{t("common.loading", { defaultValue: "Redirecting..." })}</p>
    </div>
  );
}
