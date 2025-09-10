"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, User, HelpCircle, LogOut, Settings, Menu } from "lucide-react";
import { useEffect, useState } from "react";

// Utility: combine classNames
const cn = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

// Base navigation items (without User Account)
const BASE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, trail: false },
  { href: "/products",  label: "Product",   icon: Package,         trail: false },
];

function isActive(path: string, href: string) {
  if (!path) return false;
  if (href === "/dashboard") return path === "/dashboard";
  // Match self or child routes
  return path === href || path.startsWith(href + "/");
}

type UserInfo = {
  username: string;
  role: string;
};

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Fetch current user info from whoami API
    async function load() {
      try {
        const res = await fetch("/api/auth/whoami", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.payload) {
          setUser({ username: data.payload.username, role: data.payload.role });
        }
      } catch {
        // ignore errors
      }
    }
    load();
  }, []);

  // Build navigation dynamically
  const NAV = [...BASE_NAV];
  if (user?.role === "ADMIN") {
    NAV.push({ href: "/users", label: "User Account", icon: User, trail: false });
  }

  return (
    <aside
      className="hidden md:flex md:w-60 shrink-0 flex-col gap-3 p-4 text-slate-600
                 md:sticky md:top-4 md:self-start max-h-[calc(100vh-2rem)]"
      role="navigation" aria-label="Sidebar"
    >
      {/* Welcome card */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400" />
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Welcome back,</p>
          <p className="font-semibold text-slate-800 truncate">
            {user?.username ?? "Loading.."}
          </p>
        </div>
        <div className="ml-auto text-slate-400"><Settings size={18} /></div>
      </div>

      {/* Main nav */}
      <nav className="rounded-2xl bg-white ring-1 ring-slate-100 p-2 shadow-sm">
        {NAV.map(({ href, label, icon: Icon, trail }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className={cn("text-slate-400", active && "text-white/70")}>
                <Icon size={18} />
              </span>
              <span className="font-medium">{label}</span>
              {trail && (
                <span className={cn("ml-auto text-slate-300", active && "text-white/50")}>
                  <Menu size={16} />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto rounded-2xl bg-white ring-1 ring-slate-100 p-2 shadow-sm">
        {/* <Link href="/support" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
          <span className="text-slate-400"><HelpCircle size={18} /></span>
          <span className="font-medium">Support</span>
        </Link> */}
        <Link href="/logout" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
          <span className="text-slate-400"><LogOut size={18} /></span>
          <span className="font-medium">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
