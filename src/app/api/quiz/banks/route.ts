import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import * as questionBankService from '@/lib/db/questionBank';

/**
 * 获取用户所有题库
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const banks = await questionBankService.getUserQuestionBanks(userId);
    
    return NextResponse.json(banks);
  } catch (error: any) {
    console.error('获取题库失败:', error);
    return NextResponse.json({ error: error.message || '获取题库失败' }, { status: 500 });
  }
}

/**
 * 创建新题库
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: '题库名称不能为空' }, { status: 400 });
    }

    const bank = await questionBankService.createQuestionBank({
      name: body.name,
      description: body.description,
    }, userId);
    
    return NextResponse.json(bank, { status: 201 });
  } catch (error: any) {
    console.error('创建题库失败:', error);
    return NextResponse.json({ error: error.message || '创建题库失败' }, { status: 500 });
  }
}

/**
 * 更新题库信息
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    if (!body.id) {
      return NextResponse.json({ error: '未提供题库ID' }, { status: 400 });
    }

    const bank = await questionBankService.updateQuestionBank(
      body.id,
      {
        name: body.name,
        description: body.description,
      },
      userId
    );
    
    return NextResponse.json(bank);
  } catch (error: any) {
    console.error('更新题库失败:', error);
    return NextResponse.json({ error: error.message || '更新题库失败' }, { status: 500 });
  }
}

/**
 * 删除题库
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('id');
    
    if (!bankId) {
      return NextResponse.json({ error: '未提供题库ID' }, { status: 400 });
    }

    await questionBankService.deleteQuestionBank(bankId, userId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('删除题库失败:', error);
    return NextResponse.json({ error: error.message || '删除题库失败' }, { status: 500 });
  }
} 