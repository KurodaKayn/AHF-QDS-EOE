import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

/**
 * 用户注册API接口
 * 接收用户名、邮箱和密码，创建新用户
 */
export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    // 验证所有必填字段
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      );
    }

    // 检查用户名和邮箱是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    });

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "用户名已被使用" },
        { status: 400 }
      );
    }

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "邮箱已被使用" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await hash(password, 10);

    // 创建新用户
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword
      }
    });

    // 返回新用户数据（不包括密码）
    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt
    }, { status: 201 });
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册过程中出现错误" },
      { status: 500 }
    );
  }
} 