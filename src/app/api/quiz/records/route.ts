import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import * as questionRecordService from '@/lib/db/questionRecord';

/**
 * 获取用户的答题记录
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const records = await questionRecordService.getUserQuestionRecords(userId);
    
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('获取答题记录失败:', error);
    return NextResponse.json({ error: error.message || '获取答题记录失败' }, { status: 500 });
  }
}

/**
 * 创建新答题记录
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    if (!body.questionId) {
      return NextResponse.json({ error: '未提供题目ID' }, { status: 400 });
    }

    const record = await questionRecordService.createQuestionRecord(
      {
        questionId: body.questionId,
        userAnswer: body.userAnswer,
        isCorrect: body.isCorrect,
        answeredAt: body.answeredAt || Date.now(),
      },
      userId
    );
    
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('创建答题记录失败:', error);
    return NextResponse.json({ error: error.message || '创建答题记录失败' }, { status: 500 });
  }
}

/**
 * 删除用户的错误答题记录
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');
    const bankId = searchParams.get('bankId');
    
    if (questionId) {
      // 删除特定题目的错误记录
      const count = await questionRecordService.deleteWrongRecordsByQuestionId(questionId, userId);
      return NextResponse.json({ success: true, count });
    } else if (bankId) {
      // 删除某个题库的所有记录
      const count = await questionRecordService.clearQuestionRecords(userId, bankId);
      return NextResponse.json({ success: true, count });
    } else {
      // 删除所有记录
      const count = await questionRecordService.clearQuestionRecords(userId);
      return NextResponse.json({ success: true, count });
    }
  } catch (error: any) {
    console.error('删除答题记录失败:', error);
    return NextResponse.json({ error: error.message || '删除答题记录失败' }, { status: 500 });
  }
} 