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
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username as string
          }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string, 
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  // 添加secret配置
  secret: secret
});

// v5 API路由处理函数
export const GET = handlers.GET;
export const POST = handlers.POST; 