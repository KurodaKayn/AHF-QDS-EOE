import {
  FaPlayCircle,
  FaCheck,
  FaRobot,
  FaSyncAlt,
  FaTrash,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface ReviewToolbarProps {
  wrongQuestionsCount: number;
  filteredQuestionsCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  isGenerating: boolean;
  generatingCount: number;
  isSimilarGenerating: boolean;
  onStartPractice: () => void;
  onSelectAll: () => void;
  onGenerateExplanations: () => void;
  onGenerateSimilar: () => void;
  onClearRecords: () => void;
  viewMode: "options" | "list";
  onViewModeChange: (mode: "options" | "list") => void;
  totalRecordsCount: number;
}

/**
 * Review Page Toolbar Component
 * Displays action buttons for wrong questions management
 */
export function ReviewToolbar({
  wrongQuestionsCount,
  filteredQuestionsCount,
  selectedCount,
  isAllSelected,
  isGenerating,
  generatingCount,
  isSimilarGenerating,
  onStartPractice,
  onSelectAll,
  onGenerateExplanations,
  onGenerateSimilar,
  onClearRecords,
  viewMode,
  onViewModeChange,
  totalRecordsCount,
}: ReviewToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onStartPractice}
          disabled={wrongQuestionsCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
        >
          <FaPlayCircle /> {t("review.actions.startPractice")}
        </button>
        <button
          onClick={onSelectAll}
          disabled={filteredQuestionsCount === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <FaCheck />{" "}
          {isAllSelected && filteredQuestionsCount > 0
            ? t("review.actions.deselectAll")
            : t("review.actions.selectAll")}{" "}
          ({selectedCount})
        </button>
        <button
          onClick={onGenerateExplanations}
          disabled={selectedCount === 0 || isGenerating}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
        >
          <FaRobot /> {t("review.actions.aiExplain")}{" "}
          {generatingCount > 0
            ? t("review.actions.aiExplainProgress", {
                count: generatingCount,
              })
            : ""}
        </button>
        <button
          onClick={onGenerateSimilar}
          disabled={selectedCount === 0 || isSimilarGenerating}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
        >
          <FaSyncAlt /> {t("review.actions.aiSimilar")}{" "}
          {isSimilarGenerating ? t("review.actions.aiSimilarProgress") : ""}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={viewMode}
          onChange={(e) =>
            onViewModeChange(e.target.value as "options" | "list")
          }
          className="px-3 py-2 text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="options">{t("review.actions.viewCard")}</option>
          <option value="list">{t("review.actions.viewList")}</option>
        </select>
        <button
          onClick={onClearRecords}
          disabled={totalRecordsCount === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:bg-gray-400 dark:disabled:bg-gray-500 flex items-center gap-2 transition-colors"
        >
          <FaTrash /> {t("review.actions.clearRecords")}
        </button>
      </div>
    </div>
  );
}
