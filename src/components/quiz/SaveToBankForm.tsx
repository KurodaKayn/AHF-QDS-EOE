"use client";

import { useState } from "react";
import { MdSave } from "react-icons/md";
import { QuestionBank } from "@/types/quiz";
import { useTranslation } from "react-i18next";

interface SaveToBankFormProps {
  questionBanks: QuestionBank[];
  onSave: (config: {
    mode: "new" | "existing";
    bankId?: string;
    newBankName?: string;
    newBankDescription?: string;
  }) => void;
  disabled?: boolean;
}

export function SaveToBankForm({
  questionBanks,
  onSave,
  disabled = false,
}: SaveToBankFormProps) {
  const { t } = useTranslation();
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [newBankName, setNewBankName] = useState("");
  const [newBankDescription, setNewBankDescription] = useState("");

  const handleSave = () => {
    if (saveMode === "new") {
      if (!newBankName.trim()) {
        return;
      }
      onSave({
        mode: "new",
        newBankName,
        newBankDescription,
      });
      // Reset form
      setNewBankName("");
      setNewBankDescription("");
    } else {
      if (!selectedBankId) {
        return;
      }
      onSave({
        mode: "existing",
        bankId: selectedBankId,
      });
    }
  };

  const isDisabled =
    disabled ||
    (saveMode === "new" && !newBankName.trim()) ||
    (saveMode === "existing" && !selectedBankId);

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {t("convert.save.title")}
      </h3>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="saveMode"
              checked={saveMode === "new"}
              onChange={() => setSaveMode("new")}
              className="mr-2 form-radio text-blue-600 dark:text-blue-500 bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-gray-800 dark:text-gray-200">
              {t("convert.save.newBank")}
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="saveMode"
              checked={saveMode === "existing"}
              onChange={() => setSaveMode("existing")}
              className="mr-2 form-radio text-blue-600 dark:text-blue-500 bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-gray-800 dark:text-gray-200">
              {t("convert.save.existingBank")}
            </span>
          </label>
        </div>

        {saveMode === "new" ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("convert.save.bankName")}
              </label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder={t("convert.save.bankNamePlaceholder")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("convert.save.bankDesc")}
              </label>
              <input
                type="text"
                value={newBankDescription}
                onChange={(e) => setNewBankDescription(e.target.value)}
                placeholder={t("convert.save.bankDescPlaceholder")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("convert.save.selectBank")}
            </label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="" className="text-gray-500 dark:text-gray-400">
                {t("convert.save.selectPlaceholder")}
              </option>
              {questionBanks.map((bank) => (
                <option
                  key={bank.id}
                  value={bank.id}
                  className="dark:bg-gray-700 dark:text-white"
                >
                  {bank.name} ({bank.questions.length}道题)
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isDisabled}
          className={`w-full px-4 py-3 rounded-md text-white font-semibold flex items-center justify-center transition-colors
            ${
              isDisabled
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            }
          `}
        >
          <MdSave className="mr-2" /> {t("convert.save.button")}
        </button>
      </div>
    </div>
  );
}
