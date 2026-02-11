import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "crypto";

const COOKIE_NAME = "admin_session";
const SALT = "admin";

function getSessionToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(SALT).digest("hex");
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (path.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const expected = getSessionToken();
    const valid =
      expected &&
      token &&
      token.length === expected.length &&
      (() => {
        try {
          const a = Buffer.from(token, "utf8");
          const b = Buffer.from(expected, "utf8");
          if (a.length !== b.length) return false;
          let out = 0;
          for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
          return out === 0;
        } catch {
          return false;
        }
      })();
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
