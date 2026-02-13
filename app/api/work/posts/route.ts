import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";

const KEY = "work:posts";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

export type WorkPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
  pdfUrls: string[];
  zipUrls: string[];
  createdAt: string;
};

function parsePosts(data: unknown): WorkPost[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (p): p is WorkPost =>
        p &&
        typeof p === "object" &&
        typeof (p as WorkPost).id === "string" &&
        typeof (p as WorkPost).slug === "string" &&
        typeof (p as WorkPost).title === "string" &&
        typeof (p as WorkPost).content === "string" &&
        Array.isArray((p as WorkPost).imageUrls) &&
        typeof (p as WorkPost).createdAt === "string"
    )
    .map((p) => ({
      ...p,
      videoUrls: Array.isArray((p as WorkPost).videoUrls)
        ? (p as WorkPost).videoUrls.filter((u): u is string => typeof u === "string")
        : [],
      audioUrls: Array.isArray((p as WorkPost).audioUrls)
        ? (p as WorkPost).audioUrls.filter((u): u is string => typeof u === "string")
        : [],
      pdfUrls: Array.isArray((p as WorkPost).pdfUrls)
        ? (p as WorkPost).pdfUrls.filter((u): u is string => typeof u === "string")
        : [],
      zipUrls: Array.isArray((p as WorkPost).zipUrls)
        ? (p as WorkPost).zipUrls.filter((u): u is string => typeof u === "string")
        : [],
    }));
}

export async function GET() {
  if (!hasKvEnv) {
    return NextResponse.json(
      {
        posts: [],
        warning:
          "KV storage is not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN (see docs/env.md).",
      },
      { status: 503 }
    );
  }
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []);
    posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("KV get error:", err);
    return NextResponse.json({ posts: [] });
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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const videoUrls = Array.isArray(body.videoUrls)
    ? body.videoUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const audioUrls = Array.isArray(body.audioUrls)
    ? body.audioUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const pdfUrls = Array.isArray(body.pdfUrls)
    ? body.pdfUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const zipUrls = Array.isArray(body.zipUrls)
    ? body.zipUrls.filter((u: unknown) => typeof u === "string")
    : [];
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = new Date().toISOString();
  const post: WorkPost = { id, slug, title, content, imageUrls, videoUrls, audioUrls, pdfUrls, zipUrls, createdAt };
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []);
    posts.unshift(post);
    await kv.set(KEY, posts);
    return NextResponse.json({ post });
  } catch (err) {
    console.error("KV set error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const videoUrls = Array.isArray(body.videoUrls)
    ? body.videoUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const audioUrls = Array.isArray(body.audioUrls)
    ? body.audioUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const pdfUrls = Array.isArray(body.pdfUrls)
    ? body.pdfUrls.filter((u: unknown) => typeof u === "string")
    : [];
  const zipUrls = Array.isArray(body.zipUrls)
    ? body.zipUrls.filter((u: unknown) => typeof u === "string")
    : [];
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []);
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    posts[idx] = {
      ...posts[idx],
      title,
      content,
      slug,
      imageUrls,
      videoUrls,
      audioUrls,
      pdfUrls,
      zipUrls,
    };
    await kv.set(KEY, posts);
    return NextResponse.json({ post: posts[idx] });
  } catch (err) {
    console.error("KV set error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []).filter((p) => p.id !== id);
    await kv.set(KEY, posts);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("KV set error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
