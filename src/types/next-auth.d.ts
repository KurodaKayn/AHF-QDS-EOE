import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * 扩展Session接口，添加用户ID
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    };
  }
} 