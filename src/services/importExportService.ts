import { QuestionBank, Question } from "@/types/quiz";
import {
  exportToCSV,
  exportToExcel,
  importFromCSV,
  importFromExcel,
} from "@/utils/quiz";
import { DEFAULT_EXPORT_FILENAME } from "@/constants/quiz";

export interface ExportOptions {
  bank: QuestionBank;
  format: "csv" | "excel";
}

export interface ImportOptions {
  file: File;
  format: "csv" | "excel";
  bankName?: string;
}

export interface ImportResult {
  bank: QuestionBank;
  fileName: string;
}

export async function exportQuestionBank(
  options: ExportOptions
): Promise<void> {
  const { bank, format } = options;
  const fileName = `${bank.name || DEFAULT_EXPORT_FILENAME}.${
    format === "csv" ? "csv" : "xlsx"
  }`;

  const hasTauri =
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

  if (hasTauri) {
    console.log("[Export] Using Tauri dialog");
    return exportWithTauriDialog(bank, format, fileName);
  } else {
    console.log("[Export] Using browser dialog/download");
    return exportWithBrowserDialog(bank, format, fileName);
  }
}

export async function importQuestionBank(
  options: ImportOptions
): Promise<ImportResult> {
  const { file, format, bankName } = options;

  const fileNameWithoutExt = file.name.replace(/\.(csv|xlsx?)$/i, "");
  const finalBankName = bankName?.trim() || fileNameWithoutExt;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let importedData: QuestionBank | null = null;

        if (format === "csv") {
          const content = e.target?.result as string;
          importedData = importFromCSV(content, finalBankName);
        } else {
          const content = e.target?.result as ArrayBuffer;
          importedData = importFromExcel(content, finalBankName);
        }

        if (!importedData) {
          throw new Error("Failed to parse file");
        }

        resolve({
          bank: importedData,
          fileName: file.name,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    if (format === "csv") {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

async function exportWithTauriDialog(
  bank: QuestionBank,
  format: "csv" | "excel",
  fileName: string
): Promise<void> {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");

    console.log("[Tauri] Opening save dialog with filename:", fileName);

    const filePath = await save({
      defaultPath: fileName,
      filters: [
        {
          name: format === "csv" ? "CSV Files" : "Excel Files",
          extensions: [format === "csv" ? "csv" : "xlsx"],
        },
      ],
    });

    console.log("[Tauri] Selected path:", filePath);

    if (!filePath) {
      throw new Error("User cancelled save dialog");
    }

    if (format === "csv") {
      const csv = exportToCSV(bank);
      const BOM = "\uFEFF";
      await writeFile(filePath, new TextEncoder().encode(BOM + csv));
    } else {
      const blob = exportToExcel(bank);
      const arrayBuffer = await blob.arrayBuffer();
      await writeFile(filePath, new Uint8Array(arrayBuffer));
    }

    console.log("[Tauri] File written successfully");
  } catch (error) {
    console.error("[Tauri] Export error:", error);
    throw error;
  }
}

async function exportWithBrowserDialog(
  bank: QuestionBank,
  format: "csv" | "excel",
  fileName: string
): Promise<void> {
  if ("showSaveFilePicker" in window) {
    try {
      console.log("[Browser] Using File System Access API");
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: format === "csv" ? "CSV Files" : "Excel Files",
            accept: {
              [format === "csv"
                ? "text/csv"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
                [format === "csv" ? ".csv" : ".xlsx"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();

      if (format === "csv") {
        const csv = exportToCSV(bank);
        const BOM = "\uFEFF";
        await writable.write(BOM + csv);
      } else {
        const blob = exportToExcel(bank);
        await writable.write(blob);
      }

      await writable.close();
      console.log("[Browser] File saved via File System Access API");
      return;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("User cancelled save dialog");
      }
      console.warn(
        "[Browser] File System Access API failed, falling back to download:",
        error
      );
    }
  }

  console.log("[Browser] Using traditional download");
  if (format === "csv") {
    const csv = exportToCSV(bank);
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, fileName);
  } else {
    const blob = exportToExcel(bank);
    downloadBlob(blob, fileName);
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
