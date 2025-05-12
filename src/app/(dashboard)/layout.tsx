export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="container mx-auto p-4">
      {/* ここにダッシュボード共通のヘッダーやサイドバーなどを配置可能 */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold">円安ショック・ダッシュボード</h1>
      </header>
      <main>{children}</main>
      {/* フッターなど */}
    </section>
  );
} 