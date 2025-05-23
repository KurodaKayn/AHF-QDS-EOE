import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";

// 确保有secret，首先使用环境变量，如果没有则使用一个开发环境的默认值
const secret = process.env.NEXTAUTH_SECRET;
if (!secret && process.env.NODE_ENV !== 'production') {
  console.warn("警告: 没有设置NEXTAUTH_SECRET - JWT操作可能会不安全，仅用于开发环境");
}

/**
 * NextAuth认证配置
 * 使用凭证提供器实现用户名/密码登录
 * 
 * 主要功能：
 * 1. 配置认证提供者(本例使用用户名/密码方式)
 * 2. 定义JWT会话管理策略
 * 3. 设置自定义登录页面路径
 * 4. 配置JWT和会话回调函数
 * 
 * 认证流程：
 * 1. 用户在登录页面提交用户名和密码
 * 2. NextAuth调用authorize函数验证凭据
 * 3. 验证成功后生成JWT令牌
 * 4. 使用JWT令牌维护用户会话状态
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      // 定义登录表单字段
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      /**
       * 认证函数：验证用户提供的凭据
       * 
       * 流程：
       * 1. 检查提供的用户名和密码是否存在
       * 2. 在数据库中查找对应用户名的用户
       * 3. 使用bcrypt比较密码哈希
       * 4. 验证成功返回用户信息，失败返回null
       * 
       * @param credentials 包含用户名和密码的对象
       * @returns 验证成功返回用户对象，失败返回null
       */
      async authorize(credentials) {
        // 验证是否提供了用户名和密码
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // 在数据库中查找用户
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username as string
          }
        });

        // 用户不存在
        if (!user) {
          return null;
        }

        // 验证密码
        const isPasswordValid = await compare(
          credentials.password as string, 
          user.passwordHash
        );

        // 密码不匹配
        if (!isPasswordValid) {
          return null;
        }

        // 验证成功，返回用户信息（不包含敏感数据）
        return {
          id: user.id,
          name: user.username,
          email: user.email
        };
      }
    })
  ],
  // 使用JWT策略管理会话
  session: { strategy: "jwt" },
  // 自定义登录页面路径
  pages: {
    signIn: "/login"
  },
  callbacks: {
    /**
     * JWT回调函数：在创建和更新JWT时调用
     * 
     * 功能：
     * - 将用户数据存储到JWT令牌中
     * - 确保令牌包含用户ID、名称和邮箱
     * 
     * @param params 包含token和user的对象
     * @returns 更新后的token
     */
    jwt({ token, user }) {
      // 当用户首次登录时，user对象会包含用户信息
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    /**
     * 会话回调函数：在创建会话时调用
     * 
     * 功能：
     * - 将JWT令牌中的数据同步到会话中
     * - 确保会话对象包含用户ID
     * 
     * @param params 包含session和token的对象
     * @returns 更新后的session
     */
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  // 添加JWT签名密钥
  secret: secret
});

// v5 API路由处理函数
export const GET = handlers.GET;
export const POST = handlers.POST; 