import { PrismaClient } from '../generated/prisma';

/**
 * 创建Prisma客户端实例
 * 在开发环境中保持单例模式
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 