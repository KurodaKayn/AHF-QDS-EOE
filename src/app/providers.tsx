"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * 应用提供者包装器
 * 包含NextAuth会话提供者
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 