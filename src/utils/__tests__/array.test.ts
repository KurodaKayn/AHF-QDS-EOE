import { shuffleArray } from "../array";

describe("shuffleArray", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shuffles in place using Math.random", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);
    const items = [1, 2, 3];

    const result = shuffleArray(items);

    expect(result).toBe(items);
    expect(result).toEqual([2, 3, 1]);
  });

  it("returns the same empty array without modification", () => {
    const items: number[] = [];
    const result = shuffleArray(items);
    expect(result).toBe(items);
    expect(result).toHaveLength(0);
  });

  it("returns a single-element array unchanged", () => {
    const items = [42];
    const result = shuffleArray(items);
    expect(result).toBe(items);
    expect(result).toEqual([42]);
  });
});
