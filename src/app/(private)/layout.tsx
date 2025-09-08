import Sidebar from "@/components/sidebar/sidebar";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) redirect("/login"); 

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[120rem]">
        <div className="flex gap-6 p-4 md:p-6">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}