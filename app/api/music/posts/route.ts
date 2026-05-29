import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import {
  ConcurrentPostWriteError,
  InvalidPostStoreError,
  deletePost,
  insertPost,
  updatePost,
} from "@/lib/kvPostStore";
import { MUSIC_TAGS, type MusicTag } from "@/lib/musicTags";

const KEY = "music:posts";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

function isValidTag(t: unknown): t is MusicTag {
  return typeof t === "string" && MUSIC_TAGS.includes(t as MusicTag);
}

export type MusicPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  tag: MusicTag;
  createdAt: string;
};

function parsePosts(data: unknown): MusicPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (p): p is MusicPost =>
      p &&
      typeof p === "object" &&
      typeof (p as MusicPost).id === "string" &&
      typeof (p as MusicPost).slug === "string" &&
      typeof (p as MusicPost).title === "string" &&
      typeof (p as MusicPost).content === "string" &&
      Array.isArray((p as MusicPost).imageUrls) &&
      typeof (p as MusicPost).createdAt === "string"
  ).map((p) => {
    const raw = p as MusicPost & { tag?: unknown };
    return {
      ...p,
      videoUrls: Array.isArray(raw.videoUrls)
        ? raw.videoUrls.filter((u): u is string => typeof u === "string")
        : [],
      tag: isValidTag(raw.tag) ? raw.tag : "Voc.",
    };
  });
}

function postStoreErrorResponse(err: unknown, action: string) {
  if (err instanceof InvalidPostStoreError) {
    return NextResponse.json(
      { error: "Post storage is invalid; refusing to overwrite existing data." },
      { status: 409 }
    );
  }
  if (err instanceof ConcurrentPostWriteError) {
    return NextResponse.json(
      { error: "Post storage changed while saving. Please retry." },
      { status: 409 }
    );
  }

  console.error(`KV ${action} error:`, err);
  return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 });
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
  const tag = isValidTag(body.tag) ? body.tag : "Voc.";
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = new Date().toISOString();
  const post: MusicPost = { id, slug, title, content, imageUrls, videoUrls, tag, createdAt };
  try {
    const savedPost = await insertPost(KEY, post);
    return NextResponse.json({ post: savedPost });
  } catch (err) {
    return postStoreErrorResponse(err, "save");
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
  const tag = isValidTag(body.tag) ? body.tag : "Voc.";
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const updates: Omit<MusicPost, "createdAt"> = {
    id,
    slug,
    title,
    content,
    imageUrls,
    videoUrls,
    tag,
  };
  try {
    const post = await updatePost<MusicPost>(KEY, id, updates);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (err) {
    return postStoreErrorResponse(err, "save");
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
    await deletePost(KEY, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return postStoreErrorResponse(err, "delete");
  }
}
