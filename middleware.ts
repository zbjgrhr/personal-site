import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SALT = "admin";

async function getSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return "";
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(SALT);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const au = encoder.encode(a);
  const bu = encoder.encode(b);
  let out = 0;
  for (let i = 0; i < au.length; i++) out |= au[i] ^ bu[i];
  return out === 0;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (path.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const expected = await getSessionToken();
    const valid =
      expected && token && constantTimeEqual(token, expected);
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
