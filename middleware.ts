import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 仅保护 /dashboard 路由，其余不受影响
export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value; // 按你的实际 cookie 名称修改
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};