"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const sp = useSearchParams();                   // sp 可能为 null
    const nextUrl = sp?.get("next") ?? "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
        // ① 用后端要求的字段名登录（identifier + password）
        const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
        credentials: "include",
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || "Login failed");

        const token = json?.data?.token;
        if (!token) throw new Error("Missing token from server");

        // ② 让 Next 的 API 把 token 写入 HttpOnly Cookie（安全）
        const setRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, remember }),
        credentials: "include",
        });
        if (!setRes.ok) {
        const j = await setRes.json().catch(() => null);
        throw new Error(j?.message || "Failed to persist session");
        }

        // ③ 跳转
        router.replace(nextUrl);
        router.refresh();
    } catch (err: any) {
        setError(err.message || "Login failed");
    } finally {
        setSubmitting(false);
    }
    }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部留白标题，可按需删掉 */}
      <div className="max-w-[120rem] mx-auto px-4 py-6 text-slate-400 text-sm">
        AI Build - Smart Dashboard
      </div>

      {/* 画布区域：左图右卡片的感觉（无素材时用渐变做占位） */}
      <div className="max-w-[120rem] mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-white/60 ring-1 ring-slate-100 p-6 md:p-10">
          <div className="relative h-[520px] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-sky-800">
            {/* 背景图（可替换为 /public/login-hero.jpg） */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: "url('/login-hero.jpg')" }}
            />
            {/* 遮罩以接近你给的设计 */}
            <div className="absolute inset-0 bg-slate-900/20" />

            {/* 登录卡片 */}
            <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 w-full max-w-md">
              <div className="mx-auto rounded-xl bg-white shadow-xl ring-1 ring-slate-200 p-6">
                <p className="text-[10px] tracking-wider text-slate-400 mb-1">
                  WELCOME BACK
                </p>
                <h1 className="text-lg font-semibold text-slate-900 mb-4">
                  Log In to your Account
                </h1>

                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Email */}
                  <label className="block">
                    <span className="sr-only">Email</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="johnsondoe@mail.com"
                        className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                    </div>
                  </label>

                  {/* Password */}
                  <label className="block">
                    <span className="sr-only">Password</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPwd ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  {/* Remember / Forgot */}
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <label className="inline-flex items-center gap-2 select-none">
                      <input
                        type="checkbox"
                        className="accent-slate-900"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      Remember me
                    </label>

                    <a href="/forgot-password" className="hover:underline">
                      Forgot Password?
                    </a>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    {submitting ? "Signing in…" : "CONTINUE"}
                  </button>
                </form>

                <div className="mt-6 text-[11px] text-slate-600 text-center">
                  New User?{" "}
                  <a href="/signup" className="font-medium underline">
                    SIGN UP HERE
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* 可选：页面底部留白 */}
        </div>
      </div>
    </div>
  );
}
