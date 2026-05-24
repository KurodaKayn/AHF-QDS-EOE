import { QuestionBank } from "@/types/quiz";
import { exportToCSV, exportToExcel, importFromCSV, importFromExcel } from "@/utils/quiz";
import { DEFAULT_EXPORT_FILENAME } from "@/constants/quiz";
import { invoke } from "@tauri-apps/api/core";

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

const isTauriRuntime = () =>
  typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export async function exportQuestionBank(options: ExportOptions): Promise<void> {
  const { bank, format } = options;
  const fileName = `${bank.name || DEFAULT_EXPORT_FILENAME}.${format === "csv" ? "csv" : "xlsx"}`;

  if (isTauriRuntime()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await save({
      defaultPath: fileName,
      filters: [
        {
          name: format === "csv" ? "CSV Files" : "Excel Files",
          extensions: [format === "csv" ? "csv" : "xlsx"],
        },
      ],
    });

    if (!filePath) {
      throw new Error("User cancelled save dialog");
    }

    const response = await invoke<{ bytes: number[]; fileName: string }>(
      "export_question_bank_to_bytes",
      {
        request: {
          bank,
          format,
        },
      },
    );

    await writeFile(filePath, new Uint8Array(response.bytes));
    return;
  }

  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: format === "csv" ? "CSV Files" : "Excel Files",
            accept: {
              [format === "csv"
                ? "text/csv"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]: [
                format === "csv" ? ".csv" : ".xlsx",
              ],
            },
          },
        ],
      });

      const writable = await handle.createWritable();

      if (format === "csv") {
        const csv = exportToCSV(bank);
        await writable.write("\uFEFF" + csv);
      } else {
        const blob = exportToExcel(bank);
        await writable.write(blob);
      }

      await writable.close();
      return;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("User cancelled save dialog");
      }
    }
  }

  if (format === "csv") {
    const csv = exportToCSV(bank);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, fileName);
  } else {
    downloadBlob(exportToExcel(bank), fileName);
  }
}

export async function importQuestionBank(options: ImportOptions): Promise<ImportResult> {
  const { file, format, bankName } = options;
  const fileNameWithoutExt = file.name.replace(/\.(csv|xlsx?)$/i, "");
  const finalBankName = bankName?.trim() || fileNameWithoutExt;

  if (isTauriRuntime()) {
    const arrayBuffer = await file.arrayBuffer();
    const response = await invoke<QuestionBank>("import_question_bank_from_bytes", {
      request: {
        bytes: Array.from(new Uint8Array(arrayBuffer)),
        format,
        bankName: finalBankName,
        fileName: file.name,
      },
    });

    return {
      bank: response,
      fileName: file.name,
    };
  }

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

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
