/**
 * Generate path parameters for static export
 * Since this is a server component, params generated here are used for static export
 */
export function generateStaticParams() {
  return [{ bankId: "default" }];
}

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
