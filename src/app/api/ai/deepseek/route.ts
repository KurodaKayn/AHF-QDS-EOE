import { NextRequest, NextResponse } from 'next/server';

/**
 * Deepseek API 代理
 * 该路由将前端请求代理到 Deepseek API，避免跨域问题
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, baseUrl, messages } = body;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 密钥不能为空' },
        { status: 400 }
      );
    }

    // 默认的 baseUrl
    const apiBaseUrl = baseUrl || 'https://api.deepseek.com';
    
    // 发送请求到 Deepseek API
    const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages
      })
    });
    
    // 获取响应数据
    const data = await response.json();
    
    // 如果响应失败，返回错误信息
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || `API 请求失败，状态码: ${response.status}` },
        { status: response.status }
      );
    }
    
    // 返回成功响应
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Deepseek API 代理错误:', error);
    return NextResponse.json(
      { error: error.message || '处理请求时发生未知错误' },
      { status: 500 }
    );
  }
} 