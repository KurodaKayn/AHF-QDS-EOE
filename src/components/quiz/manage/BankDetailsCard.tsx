import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionBank } from "@/model/quiz";
import { FaEdit, FaRegTrashAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useBankDetailsCard } from "./useBankDetailsCard";

interface BankDetailsCardProps {
  bank: QuestionBank;
  onUpdate: (name: string, description: string) => Promise<void>;
  onDelete: () => void;
}

export function BankDetailsCard({ bank, onUpdate, onDelete }: BankDetailsCardProps) {
  const { t } = useTranslation();
  const {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    isSaving,
    handleSave,
  } = useBankDetailsCard({ bank, onUpdate });

  return (
    <Card className="animate-fade-in shadow-lg">
      <CardHeader className="border-b dark:border-gray-700 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl md:text-2xl text-blue-700 dark:text-blue-400">
            {t("bankManage.bankLabel")}: {bank.name}
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                <FaEdit className="mr-2" /> {t("bankManage.editInfo")}
              </Button>
            )}
            <Button variant="destructive" onClick={onDelete} size="sm">
              <FaRegTrashAlt className="mr-2" /> {t("bankManage.deleteBank")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isEditing ? (
          <div className="space-y-4 pb-6 mb-6 border-b dark:border-gray-700">
            <div>
              <label
                htmlFor="bankName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("bankManage.bankName")}
              </label>
              <Input
                id="bankName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("bankManage.bankNamePlaceholder")}
                className="text-base"
              />
            </div>
            <div>
              <label
                htmlFor="bankDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("bankManage.bankDescription")}
              </label>
              <Textarea
                id="bankDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t("bankManage.bankDescPlaceholder")}
                rows={3}
                className="text-base"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                size="sm"
                disabled={isSaving}
              >
                {t("bankManage.cancel")}
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                {t("bankManage.saveChanges")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-6 mb-6 border-b dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {t("bankManage.description")}:
              </span>{" "}
              {bank.description || t("bankManage.noDescription")}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {t("bankManage.questionCount")}:
              </span>{" "}
              {bank.questions ? bank.questions.length : 0} {t("bankManage.questionUnit")}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {t("bankManage.createdAt")}
              </span>{" "}
              {bank.createdAt ? new Date(bank.createdAt).toLocaleString() : t("bankManage.unknown")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
