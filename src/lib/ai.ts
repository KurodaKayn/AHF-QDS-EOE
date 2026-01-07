// AI Config is now passed dynamically

/**
 * 调用 AI 生成文本（非流式）
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
        errorData.error?.message || `API 请求失败: ${response.status}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "调用 AI 服务失败";
    throw new Error(errorMessage);
  }
};

/**
 * 调用 AI 生成文本（流式）
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
        errorData.error?.message || `API 请求失败: ${response.status}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
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
          // 忽略解析错误
        }
      }
    }

    return fullText;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "调用 AI 服务失败";
    throw new Error(errorMessage);
  }
};
