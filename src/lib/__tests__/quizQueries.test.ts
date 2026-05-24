const mockInvoke = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("quizQueries", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    delete (window as any).__TAURI__;
    vi.restoreAllMocks();
  });

  it("falls back to local duplicate detection when Tauri is unavailable", async () => {
    const { findDuplicateQuestionsInBank } = await import("../quizQueries");
    const questions = [
      {
        id: "1",
        type: "single-choice",
        content: "What is Tauri.",
        answer: "A",
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: "2",
        type: "single-choice",
        content: "What is Tauri.",
        answer: "B",
        createdAt: 1,
        updatedAt: 1,
      },
    ] as never;

    const duplicates = await findDuplicateQuestionsInBank("bank-1", questions);
    expect(duplicates.size).toBe(1);
  });

  it("maps backend duplicate groups and search ids", async () => {
    (window as any).__TAURI_INTERNALS__ = true;
    mockInvoke.mockImplementation((command: string) => {
      if (command === "find_duplicate_question_groups") {
        return Promise.resolve([{ normalizedContent: "same", questionIds: ["a", "b"] }]);
      }
      if (command === "search_questions") {
        return Promise.resolve(["a", "c"]);
      }
      return Promise.resolve([]);
    });

    const { findDuplicateQuestionsInBank, searchQuestionIds } = await import("../quizQueries");
    const questions = [
      {
        id: "a",
        type: "single-choice",
        content: "One",
        answer: "A",
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: "b",
        type: "single-choice",
        content: "Two",
        answer: "B",
        createdAt: 1,
        updatedAt: 1,
      },
    ] as never;

    const duplicates = await findDuplicateQuestionsInBank("bank-1", questions);
    expect(Array.from(duplicates.values())[0]).toHaveLength(2);

    await expect(searchQuestionIds("One")).resolves.toEqual(new Set(["a", "c"]));
  });
});
