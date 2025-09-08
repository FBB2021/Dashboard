import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/users/:path*"],
};

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value; 
  if (token) return NextResponse.next();

  // 未登录 → 跳转到 /login?next=<原路径+查询>
  const loginUrl = new URL("/login", req.url);
  // 带上完整原路由，含查询串，方便登录后跳回
  const next = req.nextUrl.pathname + (req.nextUrl.search || "");
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
