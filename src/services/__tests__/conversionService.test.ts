const mockCallAI = vi.fn();

vi.mock("@/lib/ai", () => ({
  callAI: (...args: unknown[]) => mockCallAI(...args),
}));

describe("conversionService", () => {
  beforeEach(() => {
    mockCallAI.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates conversion to the shared AI client", async () => {
    mockCallAI.mockResolvedValue("converted");
    const { conversionService } = await import("../conversionService");
    const callback = vi.fn();

    const result = await conversionService.convert(
      {
        providerConfigId: "config-1",
        messages: [{ role: "user", content: "convert" }],
      },
      callback,
    );

    expect(mockCallAI).toHaveBeenCalledWith("config-1", [{ role: "user", content: "convert" }]);
    expect(result).toEqual({
      success: true,
      content: "converted",
    });
    expect(callback).toHaveBeenCalledWith({
      success: true,
      content: "converted",
    });
  });

  it("returns a failed result when the AI client throws", async () => {
    mockCallAI.mockRejectedValue(new Error("boom"));
    const { conversionService } = await import("../conversionService");

    await expect(
      conversionService.convert({
        providerConfigId: "config-1",
        messages: [],
      }),
    ).resolves.toEqual({
      success: false,
      error: "boom",
    });
  });
});
