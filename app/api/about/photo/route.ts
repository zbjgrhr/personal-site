import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";

const KEY = "about:photo_url";

export async function GET() {
  try {
    const url = await kv.get<string>(KEY);
    return NextResponse.json({ url: url ?? null });
  } catch (err) {
    console.error("KV get error:", err);
    return NextResponse.json({ url: null });
  }
}

export async function POST(request: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const url = typeof body.url === "string" ? body.url : "";
  try {
    await kv.set(KEY, url || null);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("KV set error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
