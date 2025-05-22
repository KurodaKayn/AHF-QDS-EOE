import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getUserSettings, updateUserSettings, resetUserSettings } from '@/lib/userSettings';

/**
 * 获取用户设置
 */
export async function GET(request: NextRequest) {
  try {
    // 获取认证token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 获取用户设置
    const settings = await getUserSettings(token.sub);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('获取用户设置失败:', error);
    return NextResponse.json({ error: '获取用户设置失败' }, { status: 500 });
  }
}

/**
 * 更新用户设置
 */
export async function PUT(request: NextRequest) {
  try {
    // 获取认证token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 获取请求体
    const data = await request.json();
    
    // 校验数据有效性
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: '无效的设置数据' }, { status: 400 });
    }
    
    // 更新用户设置
    const updatedSettings = await updateUserSettings(token.sub, data);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('更新用户设置失败:', error);
    return NextResponse.json({ error: '更新用户设置失败' }, { status: 500 });
  }
}

/**
 * 重置用户设置
 */
export async function DELETE(request: NextRequest) {
  try {
    // 获取认证token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token || !token.sub) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 重置用户设置
    const defaultSettings = await resetUserSettings(token.sub);
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('重置用户设置失败:', error);
    return NextResponse.json({ error: '重置用户设置失败' }, { status: 500 });
  }
}