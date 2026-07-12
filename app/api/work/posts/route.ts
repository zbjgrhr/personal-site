import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import {
  KvCollectionLockError,
  withKvCollectionLock,
} from "@/lib/kvCollectionLock";
import { makeUniqueSlug } from "@/lib/slugs";

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

function getRawPosts(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

function parsePosts(data: unknown): WorkPost[] {
  return getRawPosts(data)
    .filter(isWorkPost)
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
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = new Date().toISOString();
  try {
    return await withKvCollectionLock(KEY, async () => {
      const data = await kv.get<unknown>(KEY);
      const rawPosts = getRawPosts(data);
      const posts = parsePosts(rawPosts);
      const preferredSlug =
        typeof body.slug === "string" && body.slug.trim() ? body.slug : title;
      const slug = makeUniqueSlug(preferredSlug, id, posts);
      const post: WorkPost = {
        id,
        slug,
        title,
        content,
        imageUrls,
        videoUrls,
        audioUrls,
        pdfUrls,
        zipUrls,
        createdAt,
      };
      await kv.set(KEY, [post, ...rawPosts]);
      return NextResponse.json({ post });
    });
  } catch (err) {
    if (err instanceof KvCollectionLockError) {
      return NextResponse.json(
        { error: "Another update is in progress. Please retry." },
        { status: 503 }
      );
    }
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
  try {
    return await withKvCollectionLock(KEY, async () => {
      const data = await kv.get<unknown>(KEY);
      const rawPosts = getRawPosts(data);
      const posts = parsePosts(rawPosts);
      const idx = rawPosts.findIndex(
        (post) => isWorkPost(post) && post.id === id
      );
      if (idx === -1) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      const preferredSlug =
        typeof body.slug === "string" && body.slug.trim() ? body.slug : title;
      const slug = makeUniqueSlug(preferredSlug, id, posts, id);
      const post = {
        ...(rawPosts[idx] as WorkPost),
        title,
        content,
        slug,
        imageUrls,
        videoUrls,
        audioUrls,
        pdfUrls,
        zipUrls,
      };
      rawPosts[idx] = post;
      await kv.set(KEY, rawPosts);
      return NextResponse.json({ post });
    });
  } catch (err) {
    if (err instanceof KvCollectionLockError) {
      return NextResponse.json(
        { error: "Another update is in progress. Please retry." },
        { status: 503 }
      );
    }
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
    return await withKvCollectionLock(KEY, async () => {
      const data = await kv.get<unknown>(KEY);
      const rawPosts = getRawPosts(data);
      const posts = rawPosts.filter(
        (post) => !(isWorkPost(post) && post.id === id)
      );
      await kv.set(KEY, posts);
      return NextResponse.json({ ok: true });
    });
  } catch (err) {
    if (err instanceof KvCollectionLockError) {
      return NextResponse.json(
        { error: "Another update is in progress. Please retry." },
        { status: 503 }
      );
    }
    console.error("KV set error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
