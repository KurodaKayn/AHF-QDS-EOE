import { shuffleArray } from "../array";

describe("shuffleArray", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shuffles in place using Math.random", () => {
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);
    const items = [1, 2, 3];

    const result = shuffleArray(items);

    expect(result).toBe(items);
    expect(result).toEqual([2, 3, 1]);
  });
});
