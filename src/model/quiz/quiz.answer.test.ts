import { resolveAnswerOptions, splitFillInBlankAnswers } from "./quiz.answer";

describe("quiz answer helpers", () => {
  it("keeps escaped semicolons in a fill-in answer", () => {
    expect(splitFillInBlankAnswers("a;;b;c")).toEqual(["a;b", "c"]);
  });

  it("resolves both option IDs and legacy letters", () => {
    const options = [
      { id: "first", content: "First" },
      { id: "second", content: "Second" },
    ];
    expect(resolveAnswerOptions(options, ["first", "B"]).map((option) => option.content)).toEqual([
      "First",
      "Second",
    ]);
  });
});
