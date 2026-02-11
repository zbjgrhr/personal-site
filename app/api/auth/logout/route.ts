import { NextRequest, NextResponse } from "next/server";
import { getCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  const res = NextResponse.redirect(url);
  res.cookies.set(getCookieName(), "", { maxAge: 0, path: "/" });
  return res;
}
