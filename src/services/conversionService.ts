// Service for managing Web Worker-based AI conversion

import { nanoid } from "nanoid";

export interface ConversionRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
}

export interface ConversionResult {
  success: boolean;
  content?: string;
  error?: string;
}

type ResultCallback = (result: ConversionResult) => void;

class ConversionService {
  private worker: Worker | null = null;
  private pendingRequests: Map<
    string,
    {
      resolve: (result: ConversionResult) => void;
      reject: (error: Error) => void;
      callback?: ResultCallback;
    }
  > = new Map();

  initialize() {
    if (typeof window === "undefined") return;

    if (!this.worker) {
      this.worker = new Worker(
        new URL("../workers/conversion.worker.ts", import.meta.url)
      );
      this.worker.addEventListener(
        "message",
        this.handleWorkerMessage.bind(this)
      );
      this.worker.addEventListener("error", this.handleWorkerError.bind(this));
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, payload } = event.data;
    const { requestId } = payload;
    const pending = this.pendingRequests.get(requestId);

    if (!pending) return;

    const result: ConversionResult =
      type === "CONVERT_SUCCESS"
        ? { success: true, content: payload.content }
        : { success: false, error: payload.error };

    // Call the callback if it exists (for store updates)
    if (pending.callback) {
      pending.callback(result);
    }

    // Resolve the promise
    pending.resolve(result);
    this.pendingRequests.delete(requestId);
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error("Worker error:", error);
    this.pendingRequests.forEach(({ reject, callback }) => {
      const errorResult = {
        success: false,
        error: "Worker encountered an error",
      };
      if (callback) {
        callback(errorResult);
      }
      reject(new Error("Worker encountered an error"));
    });
    this.pendingRequests.clear();
  }

  async convert(
    request: ConversionRequest,
    callback?: ResultCallback
  ): Promise<ConversionResult> {
    this.initialize();

    if (!this.worker) {
      return { success: false, error: "Worker not available" };
    }

    const requestId = nanoid();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject, callback });

      this.worker!.postMessage({
        type: "CONVERT_AI",
        payload: {
          ...request,
          requestId,
        },
      });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.pendingRequests.clear();
    }
  }
}

export const conversionService = new ConversionService();
