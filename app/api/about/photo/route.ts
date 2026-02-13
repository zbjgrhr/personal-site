import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";

const KEY = "about:photo_url";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

export async function GET() {
  if (!hasKvEnv) {
    return NextResponse.json({ url: null });
  }
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
  if (!hasKvEnv) {
    return NextResponse.json(
      {
        error:
          "KV storage is not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN (see docs/env.md).",
      },
      { status: 503 }
    );
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
