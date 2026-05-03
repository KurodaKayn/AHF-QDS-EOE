import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 恢复静态导出设置
  output: "export",
  distDir: "out",
  // 启用图片优化
  images: {
    unoptimized: true,
  },
  // 导出时生成基于路由的HTML文件
  trailingSlash: true,
  // 构建时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["react-icons", "lucide-react"],
  },
};

export default nextConfig;
