import { NextRequest, NextResponse } from "next/server";
import { getCookieName, getAdminSessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  // 303 converts the logout POST into a GET so the login page is not POSTed to.
  const res = NextResponse.redirect(url, 303);
  res.cookies.set(getCookieName(), "", getAdminSessionCookieOptions("clear"));
  return res;
}
