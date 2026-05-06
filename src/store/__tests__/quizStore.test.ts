import { useQuizStore } from "../quizStore";
import { QuestionType } from "@/types/quiz";

let nanoidCounter = 0;

vi.mock("nanoid", () => {
  return {
    nanoid: vi.fn(() => `store-id-${++nanoidCounter}`),
  };
});

describe("quiz store", () => {
  beforeEach(() => {
    localStorage.clear();
    nanoidCounter = 0;
    useQuizStore.setState(useQuizStore.getInitialState());
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("manages question banks and duplicate protection", () => {
    const bank = useQuizStore.getState().addQuestionBank("Bank", "desc");

    const firstInsert = useQuizStore.getState().addQuestionToBank(bank.id, {
      type: QuestionType.SingleChoice,
      content: "What is Tauri?",
      options: [
        { id: "A", content: "Desktop" },
        { id: "B", content: "Mobile" },
      ],
      answer: "A",
      explanation: "",
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(firstInsert.isDuplicate).toBe(false);
    expect(firstInsert.question?.id).toBe("store-id-2");

    const duplicateInsert = useQuizStore.getState().addQuestionToBank(bank.id, {
      type: QuestionType.SingleChoice,
      content: "What is Tauri?",
      options: [],
      answer: "B",
      explanation: "",
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(duplicateInsert.question).toBeNull();
    expect(duplicateInsert.isDuplicate).toBe(true);

    useQuizStore.getState().setQuizSetting("checkDuplicateQuestion", false);
    const allowedDuplicate = useQuizStore.getState().addQuestionToBank(bank.id, {
      type: QuestionType.SingleChoice,
      content: "What is Tauri?",
      options: [],
      answer: "B",
      explanation: "",
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(allowedDuplicate.question).not.toBeNull();
    expect(useQuizStore.getState().getQuestionBankById(bank.id)?.questions).toHaveLength(2);
  });

  it("updates and deletes bank content while keeping records in sync", () => {
    const bank = useQuizStore.getState().addQuestionBank("Bank");
    const question = useQuizStore.getState().addQuestionToBank(bank.id, {
      type: QuestionType.ShortAnswer,
      content: "Name the framework",
      options: [],
      answer: "Next.js",
      explanation: "",
      tags: [],
      createdAt: 1,
      updatedAt: 1,
    }).question!;

    useQuizStore.getState().updateQuestionBank(bank.id, "Updated Bank", "new desc");
    expect(useQuizStore.getState().getQuestionBankById(bank.id)).toMatchObject({
      name: "Updated Bank",
      description: "new desc",
      updatedAt: 1700000000000,
    });

    useQuizStore.getState().updateQuestionInBank(bank.id, question.id, {
      content: "Name the runtime",
    });
    expect(useQuizStore.getState().getQuestionById(question.id)?.question.content).toBe(
      "Name the runtime",
    );

    useQuizStore.getState().addRecord({
      questionId: question.id,
      userAnswer: "wrong",
      isCorrect: false,
      answeredAt: 1700000000000,
    });
    useQuizStore.getState().removeWrongRecordsByQuestionId(question.id);
    expect(useQuizStore.getState().records).toHaveLength(0);

    useQuizStore.getState().addRecord({
      questionId: question.id,
      userAnswer: "correct",
      isCorrect: true,
      answeredAt: 1700000000000,
    });
    useQuizStore.getState().deleteQuestionFromBank(bank.id, question.id);

    expect(useQuizStore.getState().getQuestionById(question.id)).toBeUndefined();
    expect(useQuizStore.getState().records).toHaveLength(0);

    useQuizStore.getState().deleteQuestionBank(bank.id);
    expect(useQuizStore.getState().getQuestionBankById(bank.id)).toBeUndefined();
  });

  it("manages settings, ai configs, and import targets", async () => {
    const originalActiveId = useQuizStore.getState().settings.activeAiConfigId;
    useQuizStore.getState().setQuizSetting("shufflePracticeOptions", true);
    expect(useQuizStore.getState().settings.shufflePracticeOptions).toBe(true);

    useQuizStore.getState().addAiConfig({
      name: "Custom",
      type: "custom",
      baseUrl: "https://example.com",
      apiKey: "key",
      model: "model",
    });

    const customConfig = useQuizStore
      .getState()
      .settings.aiConfigs.find((config) => config.name === "Custom")!;
    expect(customConfig.id).toBe("store-id-1");

    useQuizStore.getState().setActiveAiConfig(customConfig.id);
    expect(useQuizStore.getState().settings.activeAiConfigId).toBe(customConfig.id);

    useQuizStore.getState().deleteAiConfig(customConfig.id);
    expect(useQuizStore.getState().settings.activeAiConfigId).toBe(originalActiveId);

    useQuizStore.getState().resetQuizSettings();
    expect(useQuizStore.getState().settings.shufflePracticeOptions).toBe(false);

    const missingImport = await useQuizStore.getState().importGeneratedQuestions(
      [
        {
          id: "q-x",
          type: QuestionType.ShortAnswer,
          content: "Missing target",
          answer: "",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      "missing-bank",
    );

    expect(missingImport).toEqual({
      success: false,
      importedCount: 0,
      skippedCount: 0,
      error: expect.any(String),
    });

    const bank = useQuizStore.getState().addQuestionBank("Import Bank");
    const importResult = await useQuizStore.getState().importGeneratedQuestions(
      [
        {
          id: "q-a",
          type: QuestionType.ShortAnswer,
          content: "Alpha",
          answer: "A",
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: "q-b",
          type: QuestionType.ShortAnswer,
          content: "Alpha",
          answer: "B",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      bank.id,
    );

    expect(importResult).toEqual({
      success: true,
      importedCount: 1,
      skippedCount: 1,
    });
  });
});
