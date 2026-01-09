import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionBank } from "@/types/quiz";
import {
  FaPlusCircle,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaSort,
  FaClock,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

export enum SortType {
  NameAsc = "nameAsc",
  NameDesc = "nameDesc",
  DateAsc = "dateAsc",
  DateDesc = "dateDesc",
}

interface BankSelectorProps {
  banks: QuestionBank[];
  selectedBankId: string | null;
  sortType: SortType;
  onSelectBank: (bankId: string) => void;
  onCreateNew: () => void;
  onSortChange: (sortType: SortType) => void;
}

export function BankSelector({
  banks,
  selectedBankId,
  sortType,
  onSelectBank,
  onCreateNew,
  onSortChange,
}: BankSelectorProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-grow w-full sm:w-auto">
          <Select onValueChange={onSelectBank} value={selectedBankId || ""}>
            <SelectTrigger className="w-full min-w-[250px] text-base py-2.5">
              <SelectValue placeholder={t("bankManage.selectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {banks.length === 0 && (
                <SelectItem value="__disabled__" disabled>
                  {t("bankManage.noBanks")}
                </SelectItem>
              )}
              {banks.map((bank) => (
                <SelectItem
                  key={bank.id}
                  value={bank.id}
                  className="text-base py-2"
                >
                  {bank.name} ({bank.questions ? bank.questions.length : 0}题)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={onCreateNew}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
        >
          <FaPlusCircle className="mr-2" /> {t("bankManage.createNew")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-1">
          排序方式:
        </span>
        <Button
          variant={sortType === SortType.NameAsc ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onSortChange(
              sortType === SortType.NameAsc
                ? SortType.NameDesc
                : SortType.NameAsc
            )
          }
          className="text-xs"
        >
          {t("bankManage.sortByName")}{" "}
          {sortType === SortType.NameAsc ? (
            <FaSortAlphaDown className="ml-1" />
          ) : sortType === SortType.NameDesc ? (
            <FaSortAlphaUp className="ml-1" />
          ) : (
            <FaSort className="ml-1" />
          )}
        </Button>

        <Button
          variant={
            sortType === SortType.DateAsc || sortType === SortType.DateDesc
              ? "default"
              : "outline"
          }
          size="sm"
          onClick={() =>
            onSortChange(
              sortType === SortType.DateDesc
                ? SortType.DateAsc
                : SortType.DateDesc
            )
          }
          className="text-xs"
        >
          {t("bankManage.sortByDate")}{" "}
          {sortType === SortType.DateAsc ? (
            <FaClock className="ml-1" />
          ) : sortType === SortType.DateDesc ? (
            <FaClock className="ml-1" />
          ) : (
            <FaSort className="ml-1" />
          )}
        </Button>
      </div>
    </>
  );
}
