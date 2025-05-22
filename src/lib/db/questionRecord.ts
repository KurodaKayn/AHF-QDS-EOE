import { prisma } from '../prisma';
import { QuestionRecord } from '@/types/quiz';

/**
 * 获取用户的答题记录
 * @param userId 用户ID
 * @returns 答题记录数组
 */
export async function getUserQuestionRecords(userId: string) {
  const records = await prisma.questionRecord.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return records.map(record => ({
    id: record.id,
    questionId: record.questionId,
    userAnswer: JSON.parse(JSON.stringify(record.answer)),
    isCorrect: record.isCorrect,
    answeredAt: record.createdAt.getTime(),
  }));
}

/**
 * 创建答题记录
 * @param data 记录数据
 * @param userId 用户ID
 * @returns 创建的记录
 */
export async function createQuestionRecord(
  data: Omit<QuestionRecord, 'id'>,
  userId: string
) {
  // 格式化记录中的答案，确保可以存入数据库
  const record = await prisma.questionRecord.create({
    data: {
      questionId: data.questionId,
      answer: JSON.parse(JSON.stringify(data.userAnswer)),
      isCorrect: data.isCorrect,
      userId,
    },
  });

  return {
    id: record.id,
    questionId: record.questionId,
    userAnswer: JSON.parse(JSON.stringify(record.answer)),
    isCorrect: record.isCorrect,
    answeredAt: record.createdAt.getTime(),
  };
}

/**
 * 删除用户的所有错误答题记录
 * @param questionId 题目ID
 * @param userId 用户ID
 * @returns 删除的记录数量
 */
export async function deleteWrongRecordsByQuestionId(questionId: string, userId: string) {
  const result = await prisma.questionRecord.deleteMany({
    where: {
      questionId,
      userId,
      isCorrect: false
    },
  });

  return result.count;
}

/**
 * 清空用户的所有答题记录
 * @param userId 用户ID
 * @param bankId 可选的题库ID，如果提供则只清空该题库的记录
 * @returns 删除的记录数量
 */
export async function clearQuestionRecords(userId: string, bankId?: string) {
  if (bankId) {
    // 获取该题库中的所有题目ID
    const questions = await prisma.question.findMany({
      where: { bankId },
      select: { id: true },
    });
    
    const questionIds = questions.map(q => q.id);
    
    // 删除这些题目的记录
    const result = await prisma.questionRecord.deleteMany({
      where: {
        userId,
        questionId: { in: questionIds },
      },
    });
    
    return result.count;
  } else {
    // 删除用户的所有记录
    const result = await prisma.questionRecord.deleteMany({
      where: { userId },
    });
    
    return result.count;
  }
} 