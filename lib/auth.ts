import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const SALT = "admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSessionToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(SALT).digest("hex");
}

export function setAdminCookie(): string {
  return getSessionToken();
}

/** Shared Set-Cookie attributes so login and logout target the same cookie. */
export function getAdminSessionCookieOptions(kind: "set" | "clear") {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: kind === "clear" ? 0 : SESSION_MAX_AGE_SECONDS,
  };
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = getSessionToken();
  if (!token || !expected || token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
