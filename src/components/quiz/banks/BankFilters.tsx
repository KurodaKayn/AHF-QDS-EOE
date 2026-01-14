"use client";

import {
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { QuestionType } from "@/types/quiz";
import { useTranslation } from "react-i18next";

interface BankFiltersProps {
  searchTerm: string;
  filterType: QuestionType | "all";
  sortOrder: "asc" | "desc";
  onSearchChange: (value: string) => void;
  onFilterChange: (type: QuestionType | "all") => void;
  onSortToggle: () => void;
}

export function BankFilters({
  searchTerm,
  filterType,
  sortOrder,
  onSearchChange,
  onFilterChange,
  onSortToggle,
}: BankFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("bankManage.searchDetailedPlaceholder")}
              className="pl-10 grow py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Question Type Filter */}
          <div className="flex items-center">
            <div className="mr-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
              <FaFilter className="inline mr-1" /> {t("bankManage.filterLabel")}
            </div>
            <select
              value={filterType}
              onChange={(e) =>
                onFilterChange(e.target.value as QuestionType | "all")
              }
              className="form-select border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{t("bankManage.allTypes")}</option>
              {Object.values(QuestionType).map((type) => (
                <option key={type} value={type}>
                  {t(`questionTypes.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={onSortToggle}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {sortOrder === "asc" ? (
              <>
                <FaSortAmountUp className="mr-2" /> {t("bankManage.sortAsc")}
              </>
            ) : (
              <>
                <FaSortAmountDown className="mr-2" /> {t("bankManage.sortDesc")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
