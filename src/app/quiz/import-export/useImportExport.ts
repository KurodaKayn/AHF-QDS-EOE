import { useState, useRef } from "react";
import { useQuizStore } from "@/store/quizStore";
import { exportQuestionBank, importQuestionBank, type ImportResult } from "@/model/import-export";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface ImportStats {
  total: number;
  added: number;
  duplicates: number;
}

/**
 * Hook to handle import and export business logic.
 * Co-located with ImportExportPage.
 */
export function useImportExport() {
  const { t } = useTranslation();
  const { questionBanks, addQuestionBank, addQuestionsToBank } = useQuizStore();

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

      const result: ImportResult = await importQuestionBank({
        file,
        format,
        bankName: importMode === "new" ? importName : undefined,
      });

      let targetBankId = "";
      if (importMode === "new") {
        const newBank = await addQuestionBank(result.bank.name, result.bank.description);
        targetBankId = newBank?.id || "";
      } else {
        targetBankId = importTargetBankId;
      }

      if (!targetBankId) {
        throw new Error("Target bank not found");
      }

      const questionsData = (result.bank.questions || []).map((question) => {
        const { id: _id, ...questionData } = question;
        return questionData;
      });

      const addResult = await addQuestionsToBank(targetBankId, questionsData);

      setImportResult({
        total: result.bank.questions?.length || 0,
        added: addResult.addedCount,
        duplicates: addResult.duplicateCount,
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
      if (error.message === "User cancelled save dialog") {
        return;
      }
      console.error("Export failed:", error);
      toast.error(t("importExport.alerts.exportFailed"));
    }
  };

  return {
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

    setSelectedBankId,
    setExportFormat,
    setImportMode,
    setImportName,
    setImportTargetBankId,
    handleImport,
    handleExport,
  };
}
