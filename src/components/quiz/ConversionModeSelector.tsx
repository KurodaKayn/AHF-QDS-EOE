"use client";

import { FaEye, FaFileCode } from "react-icons/fa";
import { Icon } from "@iconify/react";
import { ScriptTemplate } from "@/utils/scriptParser";
import { useTranslation } from "react-i18next";

interface ConversionModeSelectorProps {
  mode: "ai" | "script";
  onModeChange: (mode: "ai" | "script") => void;
  scriptTemplate?: ScriptTemplate;
  onScriptTemplateChange?: (template: ScriptTemplate) => void;
  onShowExample?: () => void;
}

export function ConversionModeSelector({
  mode,
  onModeChange,
  scriptTemplate,
  onScriptTemplateChange,
  onShowExample,
}: ConversionModeSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
        {t("convert.mode.title")}
      </h2>
      <div className="flex space-x-4">
        {(["ai", "script"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex-1 flex items-center justify-center gap-2
              ${
                mode === m
                  ? m === "ai"
                    ? "bg-blue-600 text-white dark:bg-blue-700"
                    : "bg-green-600 text-white dark:bg-green-700"
                  : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
              }
            `}
          >
            {m === "ai" ? (
              <>
                <Icon icon="icon-park:brain" className="w-5 h-5" />
                {t("convert.mode.ai")}
              </>
            ) : (
              <>
                <FaFileCode className="w-5 h-5" />
                {t("convert.mode.script")}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Script mode settings */}
      {mode === "script" &&
        scriptTemplate !== undefined &&
        onScriptTemplateChange && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t("convert.script.title")}
            </h3>
            <div className="flex items-center space-x-3">
              <label
                htmlFor="scriptTemplateSelect"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                {t("convert.script.templateLabel")}
              </label>
              <select
                id="scriptTemplateSelect"
                value={scriptTemplate}
                onChange={(e) =>
                  onScriptTemplateChange(e.target.value as ScriptTemplate)
                }
                className="grow mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value={ScriptTemplate.ChaoXing}>
                  {t("convert.script.templates.chaoxing")}
                </option>
                <option value={ScriptTemplate.SingleChoice1}>
                  {t("convert.script.templates.singleChoice1")}
                </option>
                <option value={ScriptTemplate.Other}>
                  {t("convert.script.templates.other")}
                </option>
              </select>
              {onShowExample && (
                <button
                  onClick={onShowExample}
                  className="ml-2 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-blue-300 dark:bg-blue-600 dark:hover:bg-blue-500 flex items-center"
                >
                  <FaEye className="mr-1" /> {t("convert.script.viewExample")}
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
