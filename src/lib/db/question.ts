import { prisma } from '../prisma';
import { Question, QuestionOption, QuestionType } from '@/types/quiz';

/*将前端的题目类型转换为Prisma枚举类型*/
function convertToPrismaQuestionType(type: QuestionType): any {
  const mapping: Record<QuestionType, string> = {
    [QuestionType.SingleChoice]: 'SINGLE_CHOICE',
    [QuestionType.MultipleChoice]: 'MULTIPLE_CHOICE',
    [QuestionType.TrueFalse]: 'TRUE_FALSE',
    [QuestionType.ShortAnswer]: 'SHORT_ANSWER',
    [QuestionType.FillInBlank]: 'FILL_IN_BLANK',
  };
  return mapping[type];
}

/*将Prisma枚举类型转换为前端的题目类型*/
function convertFromPrismaQuestionType(type: string): QuestionType {
  const mapping: Record<string, QuestionType> = {
    'SINGLE_CHOICE': QuestionType.SingleChoice,
    'MULTIPLE_CHOICE': QuestionType.MultipleChoice,
    'TRUE_FALSE': QuestionType.TrueFalse,
    'SHORT_ANSWER': QuestionType.ShortAnswer,
    'FILL_IN_BLANK': QuestionType.FillInBlank,
  };
  return mapping[type];
}

/*创建题目*/
export async function createQuestion(
  bankId: string, 
  questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>, 
  userId: string
) {
  // 首先验证题库属于该用户
  const bank = await prisma.questionBank.findFirst({
    where: { id: bankId, userId },
  });

  if (!bank) {
    throw new Error('题库不存在或无权限');
  }

  // 检查是否存在重复题目 (如果启用了查重)
  const checkDuplicate = true; // 这里可以从用户设置中获取
  if (checkDuplicate) {
    const existingQuestion = await prisma.question.findFirst({
      where: {
        bankId,
        content: questionData.content.trim(),
      },
    });

    if (existingQuestion) {
      return { question: null, isDuplicate: true };
    }
  }

  // 创建新题目
  const question = await prisma.question.create({
    data: {
      content: questionData.content,
      type: convertToPrismaQuestionType(questionData.type),
      options: questionData.options ? JSON.parse(JSON.stringify(questionData.options)) : null,
      answer: JSON.parse(JSON.stringify(questionData.answer)),
      explanation: questionData.explanation,
      tags: questionData.tags ? JSON.parse(JSON.stringify(questionData.tags)) : null,
      bankId,
    },
  });

  return { 
    question: formatQuestionFromDB(question), 
    isDuplicate: false 
  };
}

/**
 * 更新题目
 * @param bankId 题库ID
 * @param questionId 题目ID
 * @param questionData 更新数据
 * @param userId 用户ID (权限验证)
 * @returns 更新后的题目
 */
export async function updateQuestion(
  bankId: string,
  questionId: string,
  questionData: Partial<Omit<Question, 'id' | 'createdAt' | 'updatedAt'>>,
  userId: string
) {
  // 首先验证题库属于该用户
  const bank = await prisma.questionBank.findFirst({
    where: { id: bankId, userId },
  });

  if (!bank) {
    throw new Error('题库不存在或无权限');
  }

  // 验证题目存在且属于该题库
  const existingQuestion = await prisma.question.findFirst({
    where: { id: questionId, bankId },
  });

  if (!existingQuestion) {
    throw new Error('题目不存在或不属于该题库');
  }

  // 准备更新数据
  const updateData: any = {};
  if (questionData.content !== undefined) updateData.content = questionData.content;
  if (questionData.type !== undefined) updateData.type = convertToPrismaQuestionType(questionData.type);
  if (questionData.options !== undefined) updateData.options = JSON.parse(JSON.stringify(questionData.options));
  if (questionData.answer !== undefined) updateData.answer = JSON.parse(JSON.stringify(questionData.answer));
  if (questionData.explanation !== undefined) updateData.explanation = questionData.explanation;
  if (questionData.tags !== undefined) updateData.tags = JSON.parse(JSON.stringify(questionData.tags));

  // 更新题目
  const question = await prisma.question.update({
    where: { id: questionId },
    data: updateData,
  });

  return formatQuestionFromDB(question);
}

/**
 * 删除题目
 * @param bankId 题库ID
 * @param questionId 题目ID
 * @param userId 用户ID (权限验证)
 * @returns 是否成功
 */
export async function deleteQuestion(bankId: string, questionId: string, userId: string) {
  // 首先验证题库属于该用户
  const bank = await prisma.questionBank.findFirst({
    where: { id: bankId, userId },
  });

  if (!bank) {
    throw new Error('题库不存在或无权限');
  }

  // 验证题目存在且属于该题库
  const existingQuestion = await prisma.question.findFirst({
    where: { id: questionId, bankId },
  });

  if (!existingQuestion) {
    throw new Error('题目不存在或不属于该题库');
  }

  // 删除题目
  await prisma.question.delete({
    where: { id: questionId },
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
    type: convertFromPrismaQuestionType(dbQuestion.type) as QuestionType,
    options: dbQuestion.options as QuestionOption[],
    answer: dbQuestion.answer,
    explanation: dbQuestion.explanation || '',
    tags: dbQuestion.tags || [],
    createdAt: dbQuestion.createdAt.getTime(),
    updatedAt: dbQuestion.updatedAt.getTime(),
  };
} 