// Web Worker for handling AI conversion requests in the background

self.addEventListener("message", async (event) => {
  const { type, payload } = event.data;

  if (type === "CONVERT_AI") {
    const { baseUrl, apiKey, model, messages, requestId } = payload;

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      self.postMessage({
        type: "CONVERT_SUCCESS",
        payload: { content, requestId },
      });
    } catch (error) {
      const err = error as Error;
      self.postMessage({
        type: "CONVERT_ERROR",
        payload: {
          error: err.message || "Unknown error",
          requestId,
        },
      });
    }
  }
});
