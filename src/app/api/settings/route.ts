import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getUserSettings, updateUserSettings, resetUserSettings } from '@/lib/userSettings';

/**
 * 获取用户设置API
 * 
 * 功能：获取当前认证用户的所有设置
 * 
 * 请求方法：GET
 * 认证要求：需要用户登录，使用JWT认证
 * 成功响应：200 OK，返回用户设置对象
 * 错误响应：
 *   - 401 Unauthorized：未授权访问（未登录或会话过期）
 *   - 500 Internal Server Error：服务器内部错误
 */
export async function GET(request: NextRequest) {
  try {
    // 从请求中获取JWT认证令牌
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // 验证令牌有效性和用户ID存在
    if (!token || !token.sub) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 调用获取用户设置服务
    // token.sub包含用户ID(来自NextAuth JWT)
    const settings = await getUserSettings(token.sub);
    
    // 返回用户设置数据
    return NextResponse.json(settings);
  } catch (error) {
    // 记录错误日志
    console.error('获取用户设置失败:', error);
    
    // 返回服务器错误响应
    return NextResponse.json({ error: '获取用户设置失败' }, { status: 500 });
  }
}

/**
 * 更新用户设置API
 * 
 * 功能：更新当前认证用户的部分或全部设置
 * 
 * 请求方法：PUT
 * 请求体：JSON格式的部分或全部设置对象
 * 认证要求：需要用户登录，使用JWT认证
 * 成功响应：200 OK，返回更新后的完整用户设置
 * 错误响应：
 *   - 400 Bad Request：无效的请求数据
 *   - 401 Unauthorized：未授权访问（未登录或会话过期）
 *   - 500 Internal Server Error：服务器内部错误
 */
export async function PUT(request: NextRequest) {
  try {
    // 从请求中获取JWT认证令牌
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // 验证令牌有效性和用户ID存在
    if (!token || !token.sub) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 解析请求体中的设置数据
    const data = await request.json();
    
    // 校验数据有效性：必须是对象类型
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: '无效的设置数据' }, { status: 400 });
    }
    
    // 调用更新用户设置服务
    // 传入用户ID和部分设置数据
    const updatedSettings = await updateUserSettings(token.sub, data);
    
    // 返回更新后的完整设置
    return NextResponse.json(updatedSettings);
  } catch (error) {
    // 记录错误日志
    console.error('更新用户设置失败:', error);
    
    // 返回服务器错误响应
    return NextResponse.json({ error: '更新用户设置失败' }, { status: 500 });
  }
}

/**
 * 重置用户设置API
 * 
 * 功能：将当前认证用户的所有设置恢复为默认值
 * 
 * 请求方法：DELETE
 * 认证要求：需要用户登录，使用JWT认证
 * 成功响应：200 OK，返回重置后的默认设置
 * 错误响应：
 *   - 401 Unauthorized：未授权访问（未登录或会话过期）
 *   - 500 Internal Server Error：服务器内部错误
 */
export async function DELETE(request: NextRequest) {
  try {
    // 从请求中获取JWT认证令牌
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // 验证令牌有效性和用户ID存在
    if (!token || !token.sub) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 调用重置用户设置服务
    const defaultSettings = await resetUserSettings(token.sub);
    
    // 返回重置后的默认设置
    return NextResponse.json(defaultSettings);
  } catch (error) {
    // 记录错误日志
    console.error('重置用户设置失败:', error);
    
    // 返回服务器错误响应
    return NextResponse.json({ error: '重置用户设置失败' }, { status: 500 });
  }
}