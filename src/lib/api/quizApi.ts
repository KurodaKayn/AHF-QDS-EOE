import { Question, QuestionBank, QuestionRecord } from '@/types/quiz';

/**
 * 获取用户所有题库
 */
export async function getUserQuestionBanks(): Promise<QuestionBank[]> {
  const response = await fetch('/api/quiz/banks');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '获取题库失败');
  }
  return response.json();
}

/**
 * 创建新题库
 */
export async function createQuestionBank(data: { name: string; description?: string }): Promise<QuestionBank> {
  const response = await fetch('/api/quiz/banks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '创建题库失败');
  }
  
  return response.json();
}

/**
 * 更新题库信息
 */
export async function updateQuestionBank(data: { id: string; name?: string; description?: string }): Promise<QuestionBank> {
  const response = await fetch('/api/quiz/banks', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '更新题库失败');
  }
  
  return response.json();
}

/**
 * 删除题库
 */
export async function deleteQuestionBank(bankId: string): Promise<void> {
  const response = await fetch(`/api/quiz/banks?id=${bankId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '删除题库失败');
  }
}

/**
 * 创建新题目
 */
export async function createQuestion(bankId: string, questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
  const response = await fetch('/api/quiz/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bankId,
      ...questionData,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 409) {
      throw new Error('题目已存在');
    }
    throw new Error(errorData.error || '创建题目失败');
  }
  
  return response.json();
}

/**
 * 更新题目
 */
export async function updateQuestion(
  bankId: string,
  questionId: string,
  questionData: Partial<Omit<Question, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Question> {
  const response = await fetch('/api/quiz/questions', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bankId,
      questionId,
      ...questionData,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '更新题目失败');
  }
  
  return response.json();
}

/**
 * 删除题目
 */
export async function deleteQuestion(bankId: string, questionId: string): Promise<void> {
  const response = await fetch(`/api/quiz/questions?bankId=${bankId}&questionId=${questionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '删除题目失败');
  }
}

/**
 * 获取用户的答题记录
 */
export async function getUserQuestionRecords(): Promise<QuestionRecord[]> {
  const response = await fetch('/api/quiz/records');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '获取答题记录失败');
  }
  return response.json();
}

/**
 * 创建新答题记录
 */
export async function createQuestionRecord(data: Omit<QuestionRecord, 'id'>): Promise<QuestionRecord> {
  const response = await fetch('/api/quiz/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '创建答题记录失败');
  }
  
  return response.json();
}

/**
 * 删除题目的错误记录
 */
export async function deleteWrongRecordsByQuestionId(questionId: string): Promise<number> {
  const response = await fetch(`/api/quiz/records?questionId=${questionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '删除答题记录失败');
  }
  
  const result = await response.json();
  return result.count;
}

/**
 * 清空答题记录
 * @param bankId 可选的题库ID，如果提供则只清空该题库的记录
 */
export async function clearQuestionRecords(bankId?: string): Promise<number> {
  const url = bankId ? `/api/quiz/records?bankId=${bankId}` : '/api/quiz/records';
  const response = await fetch(url, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '清空答题记录失败');
  }
  
  const result = await response.json();
  return result.count;
} 