"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const nextUrl = sp?.get("next") ?? "/login";
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1) Clear the httpOnly cookie
        await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
        // 2) Client-side fallback: Clear accessible storage
        try {
          localStorage.removeItem("token");
        } catch {}
        // Delete writable cookies 
        document.cookie = "token=; Path=/; Max-Age=0";
        document.cookie = "refreshToken=; Path=/; Max-Age=0";

        setDone(true);
        // 1.2-second delay before transition (provide visual feedback)
        setTimeout(() => {
          router.replace(nextUrl);
          router.refresh();
        }, 1200);
      } catch (e: any) {
        setErr(e?.message || "Logout failed");
      }
    })();
  }, [router, nextUrl]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[120rem] mx-auto px-4 py-6 text-slate-400 text-sm">
        Data Table — User Accounts
      </div>

      <div className="max-w-[120rem] mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-white/60 ring-1 ring-slate-100 p-6 md:p-10">
          <div className="relative h-[420px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-sky-800">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: "url('/login-hero.jpg')" }}
            />
            <div className="absolute inset-0 bg-slate-900/20" />

            <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 w-full max-w-md">
              <div className="mx-auto rounded-xl bg-white shadow-xl ring-1 ring-slate-200 p-6">
                <p className="text-[10px] tracking-wider text-slate-400 mb-1">SECURITY</p>
                <h1 className="text-lg font-semibold text-slate-900 mb-2">
                  {done ? "You’re signed out" : "Signing you out…"}
                </h1>

                {!done && !err && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                    <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
                    Clearing session and redirecting
                  </div>
                )}

                {err && (
                  <div className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">
                    {err}
                  </div>
                )}

                {done && (
                  <div className="mt-4 text-sm text-slate-600">
                    Redirecting to&nbsp;
                    <span className="font-medium">{nextUrl}</span>…
                  </div>
                )}

                <div className="mt-6">
                  <a
                    href={nextUrl}
                    className="inline-flex justify-center w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium"
                  >
                    Go to Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}
