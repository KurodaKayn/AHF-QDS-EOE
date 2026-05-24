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

/**
 * Hook to handle import and export business logic
 */
export function useImportExport() {
  const { t } = useTranslation();
  const { questionBanks, addQuestionBank, addQuestionToBank } = useQuizStore();

  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");

  // Import states
  const [importMode, setImportMode] = useState<"new" | "existing">("new");
  const [importName, setImportName] = useState<string>("");
  const [importTargetBankId, setImportTargetBankId] = useState<string>("");

  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importResult, setImportResult] = useState<ImportStats | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file import logic
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.warning(t("importExport.alerts.inputRequired"));
      return;
    }

    if (importMode === "existing" && !importTargetBankId) {
      toast.warning(t("importExport.alerts.bankRequired"));
      return;
    }

    try {
      const format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "excel";

      // Import the file using service
      const result: ImportResult = await importQuestionBank({
        file,
        format,
        bankName: importMode === "new" ? importName : undefined,
      });

      let targetBankId = "";
      if (importMode === "new") {
        const newBank = addQuestionBank(result.bank.name, result.bank.description);
        targetBankId = newBank?.id || "";
      } else {
        targetBankId = importTargetBankId;
      }

      if (!targetBankId) {
        throw new Error("Target bank not found");
      }

      // Add questions to the target bank
      let addedCount = 0;
      let duplicateCount = 0;
      const totalCount = result.bank.questions?.length || 0;

      if (result.bank.questions && result.bank.questions.length > 0) {
        result.bank.questions.forEach((question) => {
          const { id: _id, ...questionData } = question; // Remove original ID
          const addResult = addQuestionToBank(targetBankId, questionData);
          if (addResult.isDuplicate) {
            duplicateCount++;
          } else if (addResult.question) {
            addedCount++;
          }
        });
      }

      // Update UI state with results
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
      toast.error(
        t("importExport.alerts.importFailed", {
          error: error.message || t("importExport.alerts.parseError"),
        }),
      );
    }
  };

  /**
   * Handle bank export logic
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
      // User cancelled is not an error (from save dialog)
      if (error.message === "User cancelled save dialog") {
        return;
      }
      console.error("Export failed:", error);
      toast.error(t("importExport.alerts.exportFailed"));
    }
  };

  return {
    // State
    selectedBankId,
    exportFormat,
    importMode,
    importName,
    importTargetBankId,
    importSuccess,
    exportSuccess,
    importResult,
    fileInputRef,
    questionBanks,

    // Actions
    setSelectedBankId,
    setExportFormat,
    setImportMode,
    setImportName,
    setImportTargetBankId,
    handleImport,
    handleExport,
  };
}
