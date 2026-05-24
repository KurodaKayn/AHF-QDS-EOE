import { exportToCSV, exportToExcel, importFromCSV, importFromExcel } from "@/utils/quiz";
import { QuestionBank, QuestionType } from "@/types/quiz";

const now = 1700000000000;

const buildBank = (): QuestionBank => ({
  id: "bank-regression",
  name: "Regression Bank",
  description: "Covers the core quiz flows",
  questions: [
    {
      id: "q-1",
      type: QuestionType.SingleChoice,
      content: "Which platform does Tauri target?",
      options: [
        { id: "A", content: "Desktop apps" },
        { id: "B", content: "Mobile apps" },
      ],
      answer: "A",
      explanation: "Tauri packages desktop applications.",
      tags: ["tauri", "desktop"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "q-2",
      type: QuestionType.MultipleChoice,
      content: "Select the technologies used in this project.",
      options: [
        { id: "A", content: "Next.js" },
        { id: "B", content: "Tauri" },
        { id: "C", content: "Photoshop" },
      ],
      answer: ["A", "B"],
      explanation: "The app uses Next.js and Tauri.",
      tags: ["stack"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "q-3",
      type: QuestionType.TrueFalse,
      content: "Tauri packages desktop apps.",
      answer: "true",
      explanation: "That is the core packaging model.",
      tags: ["platform"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "q-4",
      type: QuestionType.FillInBlank,
      content: "The package manager used here is ____.",
      answer: "pnpm",
      explanation: "The repo standard is pnpm.",
      tags: ["tooling"],
      createdAt: now,
      updatedAt: now,
    },
  ],
  createdAt: now,
  updatedAt: now,
});

const stripQuestion = (question: QuestionBank["questions"][number]) => ({
  type: question.type,
  content: question.content,
  options: question.options?.map((option) => ({
    id: option.id,
    content: option.content,
  })),
  answer: question.answer,
  explanation: question.explanation,
  tags: question.tags,
});

describe("regression flows", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips question banks through CSV and Excel exports", async () => {
    const bank = buildBank();

    const csvRoundTrip = importFromCSV(exportToCSV(bank), bank.name);
    const excelRoundTrip = importFromExcel(await exportToExcel(bank).arrayBuffer(), bank.name);

    for (const importedBank of [csvRoundTrip, excelRoundTrip]) {
      expect(importedBank.name).toBe(bank.name);
      expect(importedBank.questions).toHaveLength(bank.questions.length);
      expect(importedBank.questions.map(stripQuestion)).toEqual(bank.questions.map(stripQuestion));
    }
  });
});
