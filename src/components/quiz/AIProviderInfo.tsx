"use client";

import Image from "next/image";
import { AIConfig } from "@/store/quizStore";
import { useTranslation } from "react-i18next";

interface AIProviderInfoProps {
  config: AIConfig;
  showSettingsLink?: boolean;
}

export function AIProviderInfo({
  config,
  showSettingsLink = true,
}: AIProviderInfoProps) {
  const { t } = useTranslation();
  // Determine logo
  let logoFileName = "Deepseek.jpg"; // default
  if (config.provider === "alibaba") logoFileName = "Qwen.jpg";
  else if (config.provider === "deepseek") logoFileName = "Deepseek.jpg";

  const isCustom = !config.provider;

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center space-x-3">
      {!isCustom ? (
        <Image
          width={20}
          height={20}
          src={`/logo/${logoFileName}`}
          alt={`${config.name} Logo`}
          className="mr-2"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          unoptimized
        />
      ) : (
        <div className="mr-2 w-5 h-5 flex items-center justify-center bg-blue-200 dark:bg-blue-700 rounded-full text-xs font-bold text-blue-800 dark:text-blue-100">
          AI
        </div>
      )}

      <div>
        <h3 className="font-medium text-blue-800 dark:text-white">
          {t("convert.aiInfo.using", { name: config.name })}{" "}
          <span className="text-xs opacity-75">({config.model})</span>
        </h3>
        {showSettingsLink && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {t("convert.aiInfo.settingsHint").split("[")[0]}
            <a
              href="/quiz/settings"
              className="underline hover:text-blue-800 dark:hover:text-blue-200"
            >
              {t("convert.aiInfo.settingsHint").split("[")[1]?.split("]")[0] ||
                "Settings"}
            </a>
            {t("convert.aiInfo.settingsHint").split("]")[1] || ""}
          </p>
        )}
      </div>
    </div>
  );
}
