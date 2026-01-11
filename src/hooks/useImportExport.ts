// Custom hook for import/export functionality

import { useState, useRef } from "react";
import { useQuizStore } from "@/store/quizStore";
import {
  exportQuestionBank,
  importQuestionBank,
  type ImportResult,
} from "@/services/importExportService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ImportStats {
  total: number;
  added: number;
  duplicates: number;
}

export function useImportExport() {
  const { t } = useTranslation();
  const { questionBanks, addQuestionBank, addQuestionToBank } = useQuizStore();

  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [importFormat, setImportFormat] = useState<"csv" | "excel">("csv");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");
  const [importName, setImportName] = useState<string>("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importResult, setImportResult] = useState<ImportStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file import
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.warning(t("importExport.alerts.inputRequired"));
      return;
    }

    try {
      // Import the file
      const result: ImportResult = await importQuestionBank({
        file,
        format: importFormat,
        bankName: importName,
      });

      // Create new bank in store
      const newBank = addQuestionBank(
        result.bank.name,
        result.bank.description
      );

      // Add questions to the bank
      let addedCount = 0;
      let duplicateCount = 0;
      const totalCount = result.bank.questions?.length || 0;

      if (
        newBank &&
        result.bank.questions &&
        result.bank.questions.length > 0
      ) {
        result.bank.questions.forEach((question) => {
          const { id, ...questionData } = question;
          const addResult = addQuestionToBank(newBank.id, questionData);
          if (addResult.isDuplicate) {
            duplicateCount++;
          } else if (addResult.question) {
            addedCount++;
          }
        });
      }

      // Update UI state
      setImportResult({
        total: totalCount,
        added: addedCount,
        duplicates: duplicateCount,
      });

      setImportName("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setTimeout(() => setImportResult(null), 5000);
      }, 3000);
    } catch (error: any) {
      toast.error(`导入失败: ${error.message || "请检查文件格式是否正确"}`);
    }
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    if (!selectedBankId) return;

    const bank = questionBanks.find((b) => b.id === selectedBankId);
    if (!bank) return;

    try {
      await exportQuestionBank({
        bank,
        format: exportFormat,
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error: any) {
      // User cancelled is not an error
      if (error.message === "User cancelled save dialog") {
        return;
      }
      console.error("导出失败:", error);
      toast.error(t("importExport.alerts.exportFailed"));
    }
  };

  return {
    // State
    selectedBankId,
    importFormat,
    exportFormat,
    importName,
    importSuccess,
    exportSuccess,
    importResult,
    fileInputRef,
    questionBanks,

    // Actions
    setSelectedBankId,
    setImportFormat,
    setExportFormat,
    setImportName,
    handleImport,
    handleExport,
  };
}
