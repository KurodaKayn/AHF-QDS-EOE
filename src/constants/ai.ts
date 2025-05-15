/**
 * AI相关常量文件
 */

/**
 * 题库转换AI的系统提示词
 */
export const CONVERT_SYSTEM_PROMPT = `你是一个专业的题库转换助手。请将用户提供的文本精准地转换为结构化的题目数据。
题目类型包括单选题、多选题、判断题、简答题、填空题。请严格按照以下格式输出，每道题之间用空行分隔：

单选题：题目内容
A. 选项1
B. 选项2
C. 选项3
D. 选项4
答案：A
解析：可选的解析内容

多选题：题目内容
A. 选项1
B. 选项2
C. 选项3
D. 选项4
答案：A, B
解析：可选的解析内容

判断题：题目内容
答案：对 或 错 (或 True/False, 正确/错误)
解析：可选的解析内容

简答题：题目内容
答案：参考答案
解析：可选的解析内容

填空题：题目内容（使用____表示填空处）
答案：参考答案（如有多个可接受的答案，用分号分隔，如：答案1;答案2）
解析：可选的解析内容`; 

/**
 * 错题解析的AI提示词
 */
export const EXPLANATION_PROMPT = `你是一位专业的教育助手，请为以下题目提供一个详细的解析。不要复述题目内容，直接提供解析。

请包含以下内容：
1. 正确答案的详细解释
2. 相关知识点的分析
3. 用户错误的原因（如适用）
4. 避免类似错误的方法和记忆技巧

以Markdown格式输出你的解析，使用适当的标题、列表和强调来组织内容。如有需要，可以使用公式、表格等Markdown元素增强说明。`;

/**
 * 直接调用AI API的函数
 * 支持流式响应和普通响应
 */
export const callAI = async (
  provider: 'deepseek' | 'alibaba',
  messages: { role: string; content: string }[],
  apiKey: string,
  baseUrl?: string,
  streaming: boolean = false,
  onStreamChunk?: (chunk: string) => void
) => {
  try {
    // 基本请求参数
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    let endpoint;
    let requestBody;

    if (provider === 'deepseek') {
      endpoint = `${baseUrl || 'https://api.deepseek.com'}/v1/chat/completions`;
      requestBody = {
        model: 'deepseek-chat',
        messages,
        stream: streaming,
      };
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${apiKey}`
      };
    } else if (provider === 'alibaba') {
      endpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
      requestBody = {
        model: "qwen-turbo",
        messages,
        stream: streaming,
      };
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${apiKey}`
      };
    } else {
      throw new Error('不支持的AI提供商');
    }

    requestOptions.body = JSON.stringify(requestBody);

    if (streaming && onStreamChunk) {
      // 流式处理
      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API请求失败，状态码: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('响应没有包含可读流');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialLine = '';
      let completeResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码收到的块
        const chunk = decoder.decode(value, { stream: true });
        partialLine += chunk;

        // 逐行处理数据
        let lines = partialLine.split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                completeResponse += content;
                onStreamChunk(content);
              }
            } catch (e) {
              console.error('解析流数据时出错:', e);
            }
          }
        }
      }

      // 处理可能的最后一行
      if (partialLine && partialLine.startsWith('data: ') && partialLine !== 'data: [DONE]') {
        try {
          const data = JSON.parse(partialLine.slice(6));
          const content = data.choices?.[0]?.delta?.content || '';
          if (content) {
            completeResponse += content;
            onStreamChunk(content);
          }
        } catch (e) {
          console.error('解析最后一块流数据时出错:', e);
        }
      }

      return completeResponse;
    } else {
      // 非流式处理
      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API请求失败，状态码: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }
  } catch (error: any) {
    console.error('AI API 调用错误:', error);
    throw error;
  }
}; 