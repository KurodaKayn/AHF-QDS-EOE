import { prisma } from '../prisma';
import { Question, QuestionBank } from '@/types/quiz';

/**
 * 获取用户的所有题库
 * @param userId 用户ID
 * @returns 题库数组
 */
export async function getUserQuestionBanks(userId: string) {
  const banks = await prisma.questionBank.findMany({
    where: { userId },
    include: { questions: true },
    orderBy: { updatedAt: 'desc' },
  });

  // 转换数据格式以匹配前端类型
  return banks.map(bank => ({
    id: bank.id,
    name: bank.name,
    description: bank.description || '',
    questions: bank.questions.map(q => formatQuestionFromDB(q)),
    createdAt: bank.createdAt.getTime(),
    updatedAt: bank.updatedAt.getTime(),
  }));
}

/**
 * 获取单个题库
 * @param bankId 题库ID
 * @param userId 用户ID (用于权限验证)
 * @returns 题库信息
 */
export async function getQuestionBank(bankId: string, userId: string) {
  const bank = await prisma.questionBank.findFirst({
    where: { 
      id: bankId,
      userId 
    },
    include: { questions: true },
  });

  if (!bank) return null;

  return {
    id: bank.id,
    name: bank.name,
    description: bank.description || '',
    questions: bank.questions.map(q => formatQuestionFromDB(q)),
    createdAt: bank.createdAt.getTime(),
    updatedAt: bank.updatedAt.getTime(),
  };
}

/**
 * 创建题库
 * @param data 题库数据
 * @param userId 用户ID
 * @returns 创建的题库
 */
export async function createQuestionBank(data: { name: string; description?: string }, userId: string) {
  const bank = await prisma.questionBank.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
  });

  return {
    id: bank.id,
    name: bank.name,
    description: bank.description || '',
    questions: [],
    createdAt: bank.createdAt.getTime(),
    updatedAt: bank.updatedAt.getTime(),
  };
}

/**
 * 更新题库信息
 * @param bankId 题库ID
 * @param data 更新数据
 * @param userId 用户ID (权限验证)
 * @returns 更新后的题库
 */
export async function updateQuestionBank(
  bankId: string,
  data: { name?: string; description?: string },
  userId: string
) {
  // 首先验证题库属于该用户
  const existingBank = await prisma.questionBank.findFirst({
    where: { id: bankId, userId },
  });

  if (!existingBank) {
    throw new Error('题库不存在或无权限');
  }

  const bank = await prisma.questionBank.update({
    where: { id: bankId },
    data: {
      name: data.name,
      description: data.description,
    },
    include: { questions: true },
  });

  return {
    id: bank.id,
    name: bank.name,
    description: bank.description || '',
    questions: bank.questions.map(q => formatQuestionFromDB(q)),
    createdAt: bank.createdAt.getTime(),
    updatedAt: bank.updatedAt.getTime(),
  };
}

/**
 * 删除题库
 * @param bankId 题库ID
 * @param userId 用户ID (权限验证)
 * @returns 是否成功
 */
export async function deleteQuestionBank(bankId: string, userId: string) {
  // 首先验证题库属于该用户
  const existingBank = await prisma.questionBank.findFirst({
    where: { id: bankId, userId },
  });

  if (!existingBank) {
    throw new Error('题库不存在或无权限');
  }

  await prisma.questionBank.delete({
    where: { id: bankId },
  });

  return true;
}

/**
 * 从数据库格式转换为前端格式
 */
function formatQuestionFromDB(dbQuestion: any): Question {
  return {
    id: dbQuestion.id,
    content: dbQuestion.content,
    type: dbQuestion.type as any,
    options: dbQuestion.options as any[],
    answer: dbQuestion.answer,
    explanation: dbQuestion.explanation || '',
    tags: dbQuestion.tags || [],
    createdAt: dbQuestion.createdAt.getTime(),
    updatedAt: dbQuestion.updatedAt.getTime(),
  };
} 