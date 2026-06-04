import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import {
  mutatePostCollection,
  PostCollectionStoreError,
  PostNotFoundError,
} from "@/lib/postCollectionStore";

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

function isWorkPost(post: unknown): post is WorkPost {
  return (
    !!post &&
    typeof post === "object" &&
    typeof (post as WorkPost).id === "string" &&
    typeof (post as WorkPost).slug === "string" &&
    typeof (post as WorkPost).title === "string" &&
    typeof (post as WorkPost).content === "string" &&
    Array.isArray((post as WorkPost).imageUrls) &&
    typeof (post as WorkPost).createdAt === "string"
  );
}

function normalizeWorkPost(post: WorkPost): WorkPost {
  return {
    ...post,
    videoUrls: Array.isArray((post as WorkPost).videoUrls)
      ? (post as WorkPost).videoUrls.filter((u): u is string => typeof u === "string")
      : [],
    audioUrls: Array.isArray((post as WorkPost).audioUrls)
      ? (post as WorkPost).audioUrls.filter((u): u is string => typeof u === "string")
      : [],
    pdfUrls: Array.isArray((post as WorkPost).pdfUrls)
      ? (post as WorkPost).pdfUrls.filter((u): u is string => typeof u === "string")
      : [],
    zipUrls: Array.isArray((post as WorkPost).zipUrls)
      ? (post as WorkPost).zipUrls.filter((u): u is string => typeof u === "string")
      : [],
  };
}

function parsePosts(data: unknown): WorkPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isWorkPost).map(normalizeWorkPost);
}

function mutationErrorResponse(err: unknown, fallback: string) {
  console.error("KV set error:", err);
  if (err instanceof PostCollectionStoreError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
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
    await mutatePostCollection(KEY, (entries) => ({
      entries: [post, ...entries],
      result: post,
    }));
    return NextResponse.json({ post });
  } catch (err) {
    return mutationErrorResponse(err, "Failed to save");
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
    const post = await mutatePostCollection(KEY, (entries) => {
      let updatedPost: WorkPost | null = null;
      const nextEntries = entries.map((entry) => {
        if (!isWorkPost(entry) || entry.id !== id) return entry;

        updatedPost = {
          ...normalizeWorkPost(entry),
          title,
          content,
          slug,
          imageUrls,
          videoUrls,
          audioUrls,
          pdfUrls,
          zipUrls,
        };
        return updatedPost;
      });

      if (!updatedPost) throw new PostNotFoundError();
      return { entries: nextEntries, result: updatedPost };
    });
    return NextResponse.json({ post });
  } catch (err) {
    return mutationErrorResponse(err, "Failed to save");
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
    await mutatePostCollection(KEY, (entries) => ({
      entries: entries.filter((entry) => !isWorkPost(entry) || entry.id !== id),
      result: true,
    }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mutationErrorResponse(err, "Failed to delete");
  }
}
