"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { SettingItem } from "./SettingItem";

interface BooleanSettingItemProps {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BooleanSettingItem({
  title,
  description,
  value,
  onChange,
  disabled = false,
}: BooleanSettingItemProps) {
  const { t } = useTranslation();

  return (
    <SettingItem title={title} description={description}>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors w-24 text-center
          ${
            value
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {value ? t("settings.ai.enabled") : t("settings.ai.disabled")}
      </button>
    </SettingItem>
  );
}
