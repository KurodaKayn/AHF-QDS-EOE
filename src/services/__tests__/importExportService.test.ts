import { exportQuestionBank, importQuestionBank } from "../importExportService";
import { QuestionBank, QuestionType } from "@/types/quiz";

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
  });

  afterEach(() => {
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
});
