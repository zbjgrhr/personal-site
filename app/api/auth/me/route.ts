import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const ok = await isAdmin();
  return NextResponse.json({ admin: ok });
}
