import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, getCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";
  if (password !== secret) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = setAdminCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}
