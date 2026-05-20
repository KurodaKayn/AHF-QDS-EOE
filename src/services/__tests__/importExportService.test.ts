import { exportQuestionBank, importQuestionBank } from "../importExportService";
import { QuestionBank, QuestionType } from "@/types/quiz";

const mockSave = vi.fn();
const mockWriteFile = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (...args: unknown[]) => mockSave(...args),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

const bank: QuestionBank = {
  id: "bank-1",
  name: "Service Bank",
  questions: [
    {
      id: "q-1",
      type: QuestionType.SingleChoice,
      content: "Which package manager?",
      options: [
        { id: "A", content: "npm" },
        { id: "B", content: "pnpm" },
      ],
      answer: "B",
      explanation: "Repo uses pnpm",
      tags: ["tooling"],
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  createdAt: 1,
  updatedAt: 1,
};

describe("importExportService", () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockSave.mockReset();
    mockWriteFile.mockReset();
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    delete (window as any).__TAURI__;
    delete (window as any).showSaveFilePicker;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it("imports CSV files and uses the explicit bank name when provided", async () => {
    const file = new File(
      [
        `type,content,answer,explanation,tags,optionA,optionB
single-choice,Which package manager?,B,Repo uses pnpm,tooling,npm,pnpm
`,
      ],
      "source.csv",
      { type: "text/csv" },
    );

    const result = await importQuestionBank({
      file,
      format: "csv",
      bankName: "Imported Bank",
    });

    expect(result.fileName).toBe("source.csv");
    expect(result.bank).toMatchObject({
      name: "Imported Bank",
      questions: [
        {
          type: QuestionType.SingleChoice,
          content: "Which package manager?",
          answer: "B",
          explanation: "Repo uses pnpm",
          tags: ["tooling"],
        },
      ],
    });
  });

  it("imports Excel files and falls back to the file name as the bank name", async () => {
    const excelBuffer = await (await import("@/utils/quiz")).exportToExcel(bank).arrayBuffer();
    const file = new File([excelBuffer], "fallback-name.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await importQuestionBank({
      file,
      format: "excel",
    });

    expect(result.fileName).toBe("fallback-name.xlsx");
    expect(result.bank.name).toBe("fallback-name");
    expect(result.bank.questions[0]).toMatchObject({
      content: "Which package manager?",
      answer: "B",
    });
  });

  it("writes CSV data through the File System Access API when available", async () => {
    const write = vi.fn();
    const close = vi.fn();
    const createWritable = vi.fn().mockResolvedValue({ write, close });
    const showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable });
    (window as any).showSaveFilePicker = showSaveFilePicker;

    await exportQuestionBank({ bank, format: "csv" });

    expect(showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestedName: "Service Bank.csv",
      }),
    );
    expect(write).toHaveBeenCalledWith(expect.stringMatching(/^\uFEFF/));
    expect(write.mock.calls[0][0]).toContain("Which package manager?");
    expect(close).toHaveBeenCalled();
  });

  it("falls back to a traditional download when the save picker is unavailable", async () => {
    URL.createObjectURL = vi.fn().mockReturnValue("blob:test-url");
    URL.revokeObjectURL = vi.fn();
    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      click,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);

    await exportQuestionBank({ bank: { ...bank, name: "" }, format: "excel" });

    expect(createElement).toHaveBeenCalledWith("a");
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });

  describe("Tauri dialog export", () => {
    beforeEach(() => {
      (window as any).__TAURI_INTERNALS__ = true;
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("exports CSV via Tauri save dialog and writeFile", async () => {
      mockSave.mockResolvedValue("/tmp/export.csv");
      mockWriteFile.mockResolvedValue(undefined);

      await exportQuestionBank({ bank, format: "csv" });

      expect(mockSave).toHaveBeenCalledWith({
        defaultPath: "Service Bank.csv",
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
      });
      expect(mockWriteFile.mock.calls[0][0]).toBe("/tmp/export.csv");
      const bytes = mockWriteFile.mock.calls[0][1];
      // UTF-8 BOM: 0xEF, 0xBB, 0xBF
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
      const written = new TextDecoder().decode(bytes);
      expect(written).toContain("Which package manager?");
    });

    it("exports Excel via Tauri save dialog and writeFile", async () => {
      mockSave.mockResolvedValue("/tmp/export.xlsx");
      mockWriteFile.mockResolvedValue(undefined);

      await exportQuestionBank({ bank, format: "excel" });

      expect(mockSave).toHaveBeenCalledWith({
        defaultPath: "Service Bank.xlsx",
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });
      expect(mockWriteFile.mock.calls[0][0]).toBe("/tmp/export.xlsx");
      expect(mockWriteFile.mock.calls[0][1].byteLength).toBeGreaterThan(0);
    });

    it("throws when the user cancels the Tauri save dialog", async () => {
      mockSave.mockResolvedValue(null);

      await expect(exportQuestionBank({ bank, format: "csv" })).rejects.toThrow(
        "User cancelled save dialog",
      );

      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it("propagates writeFile errors to the caller", async () => {
      mockSave.mockResolvedValue("/tmp/export.csv");
      mockWriteFile.mockRejectedValue(new Error("fs:allow-write-file not granted"));

      await expect(exportQuestionBank({ bank, format: "csv" })).rejects.toThrow(
        "fs:allow-write-file not granted",
      );
    });

    it("uses DEFAULT_EXPORT_FILENAME when bank name is empty", async () => {
      mockSave.mockResolvedValue("/tmp/quiz_export.xlsx");
      mockWriteFile.mockResolvedValue(undefined);

      await exportQuestionBank({
        bank: { ...bank, name: "" },
        format: "excel",
      });

      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultPath: "quiz_export.xlsx",
        }),
      );
    });

    it("detects Tauri via __TAURI__ global as well", async () => {
      delete (window as any).__TAURI_INTERNALS__;
      (window as any).__TAURI__ = true;

      mockSave.mockResolvedValue("/tmp/export.csv");
      mockWriteFile.mockResolvedValue(undefined);

      await exportQuestionBank({ bank, format: "csv" });

      expect(mockSave).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });
});
