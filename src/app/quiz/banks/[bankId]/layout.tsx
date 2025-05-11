/**
 * 为静态导出生成路径参数
 * 由于这是服务器组件，因此服务端生成的参数用于静态导出
 */
export function generateStaticParams() {
  return [{ bankId: 'default' }];
}

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 