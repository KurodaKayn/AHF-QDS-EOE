import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

/**
 * 用户注册API接口
 * 接收用户名、邮箱和密码，创建新用户
 * 
 * 功能：
 * 1. 接收并验证注册表单数据
 * 2. 检查用户名和邮箱是否已被使用
 * 3. 加密用户密码
 * 4. 创建新用户记录
 * 5. 返回新创建的用户信息(不含密码)
 * 
 * 请求方法：POST
 * 请求体格式：JSON { username, email, password }
 * 响应格式：JSON { id, username, email, createdAt } 或 { error }
 * 
 * 状态码：
 * - 201: 创建成功
 * - 400: 请求参数错误或用户名/邮箱已存在
 * - 500: 服务器内部错误
 */
export async function POST(req: Request) {
  try {
    // 解析请求体JSON数据
    const { username, email, password } = await req.json();

    // 验证所有必填字段
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    });

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    // 如果用户名已存在，返回错误
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "用户名已被使用" },
        { status: 400 }
      );
    }

    // 如果邮箱已存在，返回错误
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "邮箱已被使用" },
        { status: 400 }
      );
    }

    // 使用bcrypt加密密码，盐值为10
    const hashedPassword = await hash(password, 10);

    // 在数据库中创建新用户
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword
      }
    });

    // 返回新用户数据（不包括密码哈希）
    // 状态码201表示资源创建成功
    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt
    }, { status: 201 });
  } catch (error) {
    // 记录错误日志
    console.error("注册失败:", error);
    
    // 返回通用错误信息，避免泄露敏感信息
    return NextResponse.json(
      { error: "注册过程中出现错误" },
      { status: 500 }
    );
  }
} 