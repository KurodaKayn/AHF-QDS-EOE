"use client";

import { useEffect, useState } from "react";
import "@/i18n/config"; // 引入 i18n 配置，确保初始化执行
import { Toaster } from "sonner";
import { ThemeRegistry } from "./ThemeRegistry";

export function Providers({ children }: { children: React.ReactNode }) {
  // 避免服务端渲染和客户端渲染不一致导致的 hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // 或者返回一个加载占位符
  }

  return (
    <>
      <ThemeRegistry />
      <Toaster position="top-center" />
      {children}
    </>
  );
}
