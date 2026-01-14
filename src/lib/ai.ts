import i18n from "@/i18n/config";

// AI Config is now passed dynamically

/**
 * Call AI to generate text (non-streaming)
 */
export const callAI = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> => {
  let apiURL = baseUrl;
  if (!apiURL.endsWith("/chat/completions")) {
    apiURL = `${apiURL.replace(/\/+$/, "")}/chat/completions`;
  }

  try {
    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          i18n.t("common.apiFailed", {
            status: response.status,
            defaultValue: `API request failed: ${response.status}`,
          })
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : i18n.t("common.aiCallFailed", {
            defaultValue: "Failed to call AI service",
          });
    throw new Error(errorMessage);
  }
};

/**
 * Call AI to generate text (streaming)
 */
export const callAIStream = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> => {
  let apiURL = baseUrl;
  if (!apiURL.endsWith("/chat/completions")) {
    apiURL = `${apiURL.replace(/\/+$/, "")}/chat/completions`;
  }

  try {
    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          i18n.t("common.apiFailed", {
            status: response.status,
            defaultValue: `API request failed: ${response.status}`,
          })
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error(
        i18n.t("common.streamReadFailed", {
          defaultValue: "Unable to read response stream",
        })
      );
    }

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk
        .split("\n")
        .filter((line) => line.trim().startsWith("data:"));

      for (const line of lines) {
        const data = line.replace(/^data: /, "");
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            onChunk(content);
          }
        } catch (e) {
          // Ignore parsing errors for partial chunks
        }
      }
    }

    return fullText;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : i18n.t("common.aiCallFailed", {
            defaultValue: "Failed to call AI service",
          });
    throw new Error(errorMessage);
  }
};
