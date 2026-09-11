import type { QuestionBank } from "../quiz/quiz.contract";

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

export interface ExportBankRequest {
  bank: QuestionBank;
  format: "csv" | "excel";
}

export interface ExportBankResponse {
  bytes: number[];
  fileName: string;
}

export interface ImportBankRequest {
  bytes: number[];
  format: "csv" | "excel";
  bankName?: string;
  fileName?: string;
}
