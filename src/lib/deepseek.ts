import axios from 'axios';
import { Question, QuestionOption, QuestionType } from '@/types/quiz';
import { generateId } from '@/utils/quiz';

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * DeepSeek客户端
 */
export class DeepseekClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 设置API密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * 调用DeepSeek API
   */
  private async callApi(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw new Error('无法连接到DeepSeek API，请检查您的API密钥和网络连接');
    }
  }

  /**
   * 解析文本为题目
   */
  async parseText(text: string): Promise<Question[]> {
    const prompt = `
请将以下文本解析为结构化试题数据。对于每个题目，请识别题型(单选题、多选题、判断题或简答题)、题目内容、选项(如果有)以及正确答案。

请按照以下JSON格式返回结果:
[
  {
    "type": "single-choice", // single-choice(单选题), multiple-choice(多选题), true-false(判断题), short-answer(简答题)
    "content": "题目内容",
    "options": [ // 选择题才有选项
      { "label": "A", "content": "选项内容" },
      { "label": "B", "content": "选项内容" }
      // ...更多选项
    ],
    "answer": "A" // 单选题答案为选项标签，多选题为标签数组["A","B"]，判断题为"true"/"false"，简答题为文本内容
  },
  // ...更多题目
]

以下是需要解析的文本:
${text}

只输出JSON格式的结果，不要有任何额外说明。`;

    try {
      const response = await this.callApi(prompt);
      const parsed = JSON.parse(response);
      
      return parsed.map((item: any) => {
        const now = Date.now();
        
        // 解析题目类型
        let questionType: QuestionType;
        switch (item.type) {
          case 'single-choice':
            questionType = QuestionType.SingleChoice;
            break;
          case 'multiple-choice':
            questionType = QuestionType.MultipleChoice;
            break;
          case 'true-false':
            questionType = QuestionType.TrueFalse;
            break;
          default:
            questionType = QuestionType.ShortAnswer;
        }
        
        // 解析选项
        const options: QuestionOption[] = (item.options || []).map((opt: any) => ({
          id: generateId(),
          content: opt.content,
        }));
        
        return {
          id: generateId(),
          type: questionType,
          content: item.content,
          options: options.length > 0 ? options : undefined,
          answer: item.answer,
          createdAt: now,
          updatedAt: now,
        };
      });
    } catch (error) {
      console.error('解析题目失败:', error);
      throw new Error('解析题目失败，请检查文本格式或API响应');
    }
  }
} 