import { FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { QuestionBank } from "@/types/quiz";

interface ReviewSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterBankId: string | "all";
  onFilterChange: (bankId: string | "all") => void;
  questionBanks: QuestionBank[];
}

/**
 * Review Page Search and Filter Bar Component
 * Provides search input and bank filter dropdown
 */
export function ReviewSearchBar({
  searchTerm,
  onSearchChange,
  filterBankId,
  onFilterChange,
  questionBanks,
}: ReviewSearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder={t("review.search.placeholder")}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      </div>
      <select
        value={filterBankId}
        onChange={(e) => onFilterChange(e.target.value)}
        className="px-3 py-2 text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500 shadow-sm sm:w-auto w-full"
      >
        <option value="all">{t("review.search.allBanks")}</option>
        {questionBanks.map((bank) => (
          <option key={bank.id} value={bank.id}>
            {bank.name}
          </option>
        ))}
      </select>
    </div>
  );
}
