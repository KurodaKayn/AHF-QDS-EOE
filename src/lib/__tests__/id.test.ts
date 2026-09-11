import { describe, it, expect } from "vitest";
import { generateId } from "../id";

describe("lib/id", () => {
  it("should generate a valid non-empty string id", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate unique ids", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
