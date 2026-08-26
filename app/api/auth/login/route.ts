import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, getCookieName, getAdminSessionCookieOptions } from "@/lib/auth";

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
  res.cookies.set(getCookieName(), token, getAdminSessionCookieOptions("set"));
  return res;
}
