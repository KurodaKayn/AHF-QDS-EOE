import {
  exportToCSV,
  exportToExcel,
  importFromCSV,
  importFromExcel,
} from "./import-export.serializer";
import {
  createEmptyBank,
  createQuestion,
  QuestionType,
  type Question,
  type QuestionBank,
} from "@/model/quiz";
import { generateId } from "@/lib/id";

vi.mock("nanoid", () => {
  let counter = 0;
  return {
    nanoid: vi.fn(() => `mock-id-${++counter}`),
  };
});

describe("quiz utils", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates banks and questions with stable metadata", () => {
    expect(generateId()).toBe("mock-id-1");

    const bank = createEmptyBank("Bank", "Description");
    expect(bank).toMatchObject({
      id: "mock-id-2",
      name: "Bank",
      description: "Description",
      questions: [],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });

    const question = createQuestion(
      QuestionType.MultipleChoice,
      "Pick the stack",
      [{ content: "Next.js" }, { content: "Tauri" }],
      ["A", "B"],
      "Core stack",
      ["stack"],
    );

    expect(question).toMatchObject({
      id: "mock-id-3",
      type: QuestionType.MultipleChoice,
      content: "Pick the stack",
      answer: ["A", "B"],
      explanation: "Core stack",
      tags: ["stack"],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    });
    expect(question.options).toEqual([
      { id: "mock-id-4", content: "Next.js" },
      { id: "mock-id-5", content: "Tauri" },
    ]);
  });

  it("exports and imports question data with type-specific normalization", async () => {
    const bank = {
      id: "bank-1",
      name: "Export Bank",
      questions: [
        {
          id: "q-1",
          type: QuestionType.MultipleChoice,
          content: "Select two",
          options: [
            { id: "A", content: "Alpha" },
            { id: "B", content: "Beta" },
          ],
          answer: ["A", "B"],
          explanation: "Both are correct",
          tags: ["tag-one", "tag-two"],
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: "q-2",
          type: QuestionType.TrueFalse,
          content: "Tauri is a desktop app framework",
          answer: "TRUE",
          explanation: "",
          tags: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      createdAt: 1,
      updatedAt: 1,
    };

    const csv = exportToCSV(bank);
    expect(csv).toContain("multiple-choice");
    expect(csv).toContain("A,B");
    expect(csv).toContain("true");

    const csvRoundTrip = importFromCSV(csv, bank.name);
    expect(csvRoundTrip.name).toBe(bank.name);
    expect(csvRoundTrip.questions).toHaveLength(2);
    expect(csvRoundTrip.questions[0]).toMatchObject({
      type: QuestionType.MultipleChoice,
      content: "Select two",
      answer: ["A", "B"],
      explanation: "Both are correct",
      tags: ["tag-one", "tag-two"],
    });
    expect(csvRoundTrip.questions[1]).toMatchObject({
      type: QuestionType.TrueFalse,
      answer: "true",
    });

    const excelBuffer = await exportToExcel(bank).arrayBuffer();
    const excelRoundTrip = importFromExcel(excelBuffer, bank.name);

    expect(excelRoundTrip.questions).toHaveLength(2);
    expect(excelRoundTrip.questions[0].options).toEqual([
      { id: "A", content: "Alpha" },
      { id: "B", content: "Beta" },
    ]);
    expect(excelRoundTrip.questions[0].answer).toEqual(["A", "B"]);
    expect(excelRoundTrip.questions[1].answer).toBe("true");
  });

  it("keeps empty cells out of imported options and tags", () => {
    const csv = `type,content,answer,explanation,tags,optionA,optionB,optionC
single-choice,Choose one,A,,tag-one,,Beta,
`;

    const bank = importFromCSV(csv, "Bank");

    expect(bank.questions).toHaveLength(1);
    expect(bank.questions[0].options).toEqual([{ id: "B", content: "Beta" }]);
    expect(bank.questions[0].tags).toEqual(["tag-one"]);
  });

  it("round-trips question banks with all question types through CSV and Excel exports", async () => {
    const bank: QuestionBank = {
      id: "bank-regression",
      name: "Regression Bank",
      description: "Covers all question types",
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
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
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
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
        {
          id: "q-3",
          type: QuestionType.TrueFalse,
          content: "Tauri packages desktop apps.",
          answer: "true",
          explanation: "That is the core packaging model.",
          tags: ["platform"],
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
        {
          id: "q-4",
          type: QuestionType.FillInBlank,
          content: "The package manager used here is ____.",
          answer: "pnpm",
          explanation: "The repo standard is pnpm.",
          tags: ["tooling"],
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
      ],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    };

    const stripQuestion = (q: Question) => ({
      type: q.type,
      content: q.content,
      options: q.options?.map((opt) => ({ id: opt.id, content: opt.content })),
      answer: q.answer,
      explanation: q.explanation,
      tags: q.tags,
    });

    const csvRoundTrip = importFromCSV(exportToCSV(bank), bank.name);
    const excelRoundTrip = importFromExcel(await exportToExcel(bank).arrayBuffer(), bank.name);

    for (const importedBank of [csvRoundTrip, excelRoundTrip]) {
      expect(importedBank.name).toBe(bank.name);
      expect(importedBank.questions).toHaveLength(bank.questions.length);
      expect(importedBank.questions.map(stripQuestion)).toEqual(bank.questions.map(stripQuestion));
    }
  });
});
