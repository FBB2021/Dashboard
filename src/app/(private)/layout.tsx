import Sidebar from "@/components/sidebar/sidebar";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[120rem]">
        <div className="flex gap-6 p-4 md:p-6">
          {/* 持久 Sidebar：所有 (private) 下的路由都会显示 */}
          <Sidebar />
          {/* 右侧内容区域：滚动、撑满 */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}