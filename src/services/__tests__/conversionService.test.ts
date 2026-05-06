let nanoidCounter = 0;

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => `conversion-id-${++nanoidCounter}`),
}));

interface WorkerListeners {
  message?: (event: MessageEvent) => void;
  error?: (event: ErrorEvent) => void;
}

class FakeWorker {
  static instances: FakeWorker[] = [];
  listeners: WorkerListeners = {};
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    FakeWorker.instances.push(this);
  }

  addEventListener(type: "message" | "error", listener: WorkerListeners[typeof type]) {
    this.listeners[type] = listener as never;
  }

  emitMessage(data: unknown) {
    this.listeners.message?.({ data } as MessageEvent);
  }

  emitError() {
    this.listeners.error?.({ message: "failed" } as ErrorEvent);
  }
}

describe("conversionService", () => {
  beforeEach(() => {
    nanoidCounter = 0;
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    const { conversionService } = await import("../conversionService");
    conversionService.terminate();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts conversion requests to the worker and resolves successful responses", async () => {
    const { conversionService } = await import("../conversionService");
    const callback = vi.fn();
    const request = {
      baseUrl: "https://example.com",
      apiKey: "key",
      model: "model",
      messages: [{ role: "user", content: "convert" }],
    };

    const promise = conversionService.convert(request, callback);
    const worker = FakeWorker.instances[0];

    expect(worker.postMessage).toHaveBeenCalledWith({
      type: "CONVERT_AI",
      payload: {
        ...request,
        requestId: "conversion-id-1",
      },
    });

    worker.emitMessage({
      type: "CONVERT_SUCCESS",
      payload: {
        requestId: "conversion-id-1",
        content: "converted",
      },
    });

    await expect(promise).resolves.toEqual({
      success: true,
      content: "converted",
    });
    expect(callback).toHaveBeenCalledWith({
      success: true,
      content: "converted",
    });
  });

  it("resolves failed worker responses as unsuccessful conversion results", async () => {
    const { conversionService } = await import("../conversionService");
    const callback = vi.fn();
    const promise = conversionService.convert(
      {
        baseUrl: "https://example.com",
        apiKey: "key",
        model: "model",
        messages: [],
      },
      callback,
    );

    FakeWorker.instances[0].emitMessage({
      type: "CONVERT_ERROR",
      payload: {
        requestId: "conversion-id-1",
        error: "bad response",
      },
    });

    await expect(promise).resolves.toEqual({
      success: false,
      error: "bad response",
    });
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "bad response",
    });
  });

  it("rejects all pending requests when the worker emits an error", async () => {
    const { conversionService } = await import("../conversionService");
    const callback = vi.fn();
    const promise = conversionService.convert(
      {
        baseUrl: "https://example.com",
        apiKey: "key",
        model: "model",
        messages: [],
      },
      callback,
    );

    FakeWorker.instances[0].emitError();

    await expect(promise).rejects.toThrow("Worker encountered an error");
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "Worker encountered an error",
    });
  });
});
