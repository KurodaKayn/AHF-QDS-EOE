import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionBank } from "@/types/quiz";
import { FaPlusCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface BankSelectorProps {
  banks: QuestionBank[];
  selectedBankId: string | null;
  onSelectBank: (bankId: string) => void;
  onCreateNew: () => void;
}

export function BankSelector({
  banks,
  selectedBankId,
  onSelectBank,
  onCreateNew,
}: BankSelectorProps) {
  const { t } = useTranslation();

  return (
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
                {bank.name} (
                {t("home.questionCount", {
                  count: bank.questions ? bank.questions.length : 0,
                })}
                )
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
  );
}
