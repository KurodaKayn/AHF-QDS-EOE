import { describe, it, expect } from "vitest";
import { normalizeText } from "./string";

describe("lib/string", () => {
  it("should normalize punctuation and whitespace", () => {
    expect(normalizeText("  Hello (World)！。 ")).toBe("hello world！");
    expect(normalizeText("测试（括号）与。句号.")).toBe("测试括号与句号");
  });

  it("should lowercase uppercase letters", () => {
    expect(normalizeText("ABC Def GHI")).toBe("abc def ghi");
  });
});
