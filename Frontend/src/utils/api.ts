/**
 * API客户端
 * 封装与后端API的交互
 */

import { User } from '@/types/auth';
import { Question, QuestionBank, QuestionRecord } from '@/types/quiz';

// API基础URL
const API_BASE_URL = 'http://localhost:8080/api/v1';

// 本地存储中的认证令牌键名
const AUTH_TOKEN_KEY = 'auth_token';

/**
 * 获取本地存储的JWT令牌
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * 保存JWT令牌到本地存储
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * 从本地存储中移除JWT令牌
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * 基础API请求函数
 */
const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  requiresAuth: boolean = true
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 如果需要认证，添加Authorization头
  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('未授权，请先登录');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `请求失败，状态码: ${response.status}`);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`请求失败，状态码: ${response.status}`);
    }
  }
  
  const responseData = await response.json();
  return responseData as T;
};

/**
 * 用户API
 */
export const UserAPI = {
  /**
   * 用户注册
   */
  register: async (username: string, password: string, email?: string): Promise<{ token: string; user: User }> => {
    const data = await apiRequest<any>('/register', 'POST', { username, password, email }, false);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },
  
  /**
   * 用户登录
   */
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const data = await apiRequest<any>('/login', 'POST', { username, password }, false);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },
  
  /**
   * 获取用户个人资料
   */
  getProfile: async (): Promise<{ user: User }> => {
    return apiRequest<{ user: User }>('/profile', 'GET');
  },
  
  /**
   * 更新用户个人资料
   */
  updateProfile: async (email: string): Promise<{ user: User }> => {
    return apiRequest<{ user: User }>('/profile', 'PUT', { email });
  },
  
  /**
   * 修改密码
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/change-password', 'POST', { old_password: oldPassword, new_password: newPassword });
  },
  
  /*登出*/
  logout: (): void => {
    removeAuthToken();
  },
};

/**
 * 题库API
 */
export const QuestionBankAPI = {
  /**
   * 创建题库
   */
  createBank: async (name: string, description?: string): Promise<{ bank: QuestionBank }> => {
    return apiRequest<{ bank: QuestionBank }>('/banks', 'POST', { name, description });
  },
  
  /**
   * 获取所有题库
   */
  getBanks: async (): Promise<{ banks: QuestionBank[] }> => {
    return apiRequest<{ banks: QuestionBank[] }>('/banks', 'GET');
  },
  
  /**
   * 获取题库详情
   */
  getBank: async (bankId: string): Promise<{ bank: QuestionBank }> => {
    return apiRequest<{ bank: QuestionBank }>(`/banks/${bankId}`, 'GET');
  },
  
  /**
   * 更新题库
   */
  updateBank: async (bankId: string, name: string, description?: string): Promise<{ bank: QuestionBank }> => {
    return apiRequest<{ bank: QuestionBank }>(`/banks/${bankId}`, 'PUT', { name, description });
  },
  
  /**
   * 删除题库
   */
  deleteBank: async (bankId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/banks/${bankId}`, 'DELETE');
  },
};

/**
 * 题目API
 */
export const QuestionAPI = {
  /**
   * 创建题目
   */
  createQuestion: async (bankId: string, question: Omit<Question, 'id'>): Promise<{ question: Question }> => {
    return apiRequest<{ question: Question }>(`/banks/${bankId}/questions`, 'POST', question);
  },
  
  /**
   * 获取题库中的所有题目
   */
  getBankQuestions: async (bankId: string): Promise<{ questions: Question[] }> => {
    return apiRequest<{ questions: Question[] }>(`/banks/${bankId}/questions`, 'GET');
  },
  
  /**
   * 获取题目详情
   */
  getQuestion: async (questionId: string): Promise<{ question: Question }> => {
    return apiRequest<{ question: Question }>(`/questions/${questionId}`, 'GET');
  },
  
  /**
   * 更新题目
   */
  updateQuestion: async (questionId: string, questionData: Partial<Omit<Question, 'id'>>): Promise<{ question: Question }> => {
    return apiRequest<{ question: Question }>(`/questions/${questionId}`, 'PUT', questionData);
  },
  
  /**
   * 删除题目
   */
  deleteQuestion: async (questionId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/questions/${questionId}`, 'DELETE');
  },
  
  /**
   * 批量导入题目
   */
  importQuestions: async (bankId: string, questions: Omit<Question, 'id'>[]): Promise<{ count: number }> => {
    return apiRequest<{ count: number }>(`/banks/${bankId}/questions/import`, 'POST', questions);
  },
};

/**
 * 答题记录API
 */
export const RecordAPI = {
  /**
   * 添加答题记录
   */
  addRecord: async (questionId: string, userAnswer: string | string[], isCorrect: boolean): Promise<{ record: QuestionRecord }> => {
    return apiRequest<{ record: QuestionRecord }>('/records', 'POST', {
      question_id: questionId,
      user_answer: typeof userAnswer === 'string' ? userAnswer : JSON.stringify(userAnswer),
      is_correct: isCorrect,
    });
  },
  
  /**
   * 获取答题记录
   */
  getRecords: async (isCorrect?: boolean): Promise<{ records: QuestionRecord[] }> => {
    const query = isCorrect !== undefined ? `?is_correct=${isCorrect}` : '';
    return apiRequest<{ records: QuestionRecord[] }>(`/records${query}`, 'GET');
  },
  
  /**
   * 获取错题
   */
  getWrongQuestions: async (): Promise<{ questions: Question[] }> => {
    return apiRequest<{ questions: Question[] }>('/records/wrong', 'GET');
  },
  
  /**
   * 清空答题记录
   */
  clearRecords: async (bankId?: string): Promise<{ message: string }> => {
    const query = bankId ? `?bank_id=${bankId}` : '';
    return apiRequest<{ message: string }>(`/records${query}`, 'DELETE');
  },
  
  /**
   * 移除错题记录
   */
  removeWrongRecord: async (questionId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/records/${questionId}/wrong`, 'DELETE');
  },
};

/**
 * AI API
 */
export const AIAPI = {
  /**
   * 调用DeepSeek API
   */
  callDeepSeek: async (
    apiKey: string,
    baseUrl: string | undefined,
    messages: { role: string; content: string }[]
  ): Promise<string> => {
    const data = await apiRequest<any>(
      '/ai/deepseek',
      'POST',
      { api_key: apiKey, base_url: baseUrl, messages },
      false
    );
    return data.choices[0]?.message?.content || '';
  },
  
  /**
   * 调用阿里云通义千问 API
   */
  callAlibaba: async (
    apiKey: string,
    messages: { role: string; content: string }[]
  ): Promise<string> => {
    const data = await apiRequest<any>(
      '/ai/alibaba',
      'POST',
      { api_key: apiKey, messages },
      false
    );
    return data.choices[0]?.message?.content || '';
  },
};
