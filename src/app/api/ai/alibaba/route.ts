import { NextRequest, NextResponse } from 'next/server';

// 阿里云通义千问固定参数
const ALIBABA_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const ALIBABA_MODEL = "qwen-plus";

/**
 * 通义千问 API 代理
 * 该路由将前端请求代理到阿里云通义千问 API，避免跨域问题
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, messages } = body;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 密钥不能为空' },
        { status: 400 }
      );
    }
    
    // 发送请求到通义千问 API
    const response = await fetch(`${ALIBABA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: ALIBABA_MODEL,
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
    console.error('通义千问 API 代理错误:', error);
    return NextResponse.json(
      { error: error.message || '处理请求时发生未知错误' },
      { status: 500 }
    );
  }
} 