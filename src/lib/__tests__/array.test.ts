import { describe, it, expect } from "vitest";
import { shuffleArray } from "../array";

describe("lib/array", () => {
  it("should shuffle an array without losing elements", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const originalLength = input.length;
    const shuffled = shuffleArray([...input]);

    expect(shuffled).toHaveLength(originalLength);
    expect(shuffled.sort((a, b) => a - b)).toEqual(input);
  });

  it("should handle empty and single-element arrays", () => {
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray([42])).toEqual([42]);
  });
});
