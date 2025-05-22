import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import * as questionService from '@/lib/db/question';

/**
 * 创建新题目
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    if (!body.bankId) {
      return NextResponse.json({ error: '未提供题库ID' }, { status: 400 });
    }

    if (!body.content || !body.type) {
      return NextResponse.json({ error: '题目内容和类型不能为空' }, { status: 400 });
    }

    const result = await questionService.createQuestion(
      body.bankId,
      {
        content: body.content,
        type: body.type,
        options: body.options,
        answer: body.answer,
        explanation: body.explanation,
        tags: body.tags,
      },
      userId
    );
    
    if (result.isDuplicate) {
      return NextResponse.json({ error: '题目已存在', isDuplicate: true }, { status: 409 });
    }
    
    return NextResponse.json(result.question, { status: 201 });
  } catch (error: any) {
    console.error('创建题目失败:', error);
    return NextResponse.json({ error: error.message || '创建题目失败' }, { status: 500 });
  }
}

/**
 * 更新题目
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    if (!body.bankId || !body.questionId) {
      return NextResponse.json({ error: '未提供题库ID或题目ID' }, { status: 400 });
    }

    const question = await questionService.updateQuestion(
      body.bankId,
      body.questionId,
      {
        content: body.content,
        type: body.type,
        options: body.options,
        answer: body.answer,
        explanation: body.explanation,
        tags: body.tags,
      },
      userId
    );
    
    return NextResponse.json(question);
  } catch (error: any) {
    console.error('更新题目失败:', error);
    return NextResponse.json({ error: error.message || '更新题目失败' }, { status: 500 });
  }
}

/**
 * 删除题目
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('bankId');
    const questionId = searchParams.get('questionId');
    
    if (!bankId || !questionId) {
      return NextResponse.json({ error: '未提供题库ID或题目ID' }, { status: 400 });
    }

    await questionService.deleteQuestion(bankId, questionId, userId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除题目失败:', error);
    return NextResponse.json({ error: error.message || '删除题目失败' }, { status: 500 });
  }
} 