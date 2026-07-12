import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import {
  KvCollectionLockError,
  withKvCollectionLock,
} from "@/lib/kvCollectionLock";
import { MUSIC_TAGS, type MusicTag } from "@/lib/musicTags";
import { makeUniqueSlug } from "@/lib/slugs";

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

function isMusicPost(post: unknown): post is MusicPost {
  return (
    !!post &&
    typeof post === "object" &&
    typeof (post as MusicPost).id === "string" &&
    typeof (post as MusicPost).slug === "string" &&
    typeof (post as MusicPost).title === "string" &&
    typeof (post as MusicPost).content === "string" &&
    Array.isArray((post as MusicPost).imageUrls) &&
    typeof (post as MusicPost).createdAt === "string"
  );
}

function getRawPosts(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

function parsePosts(data: unknown): MusicPost[] {
  return getRawPosts(data).filter(isMusicPost).map((p) => {
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
      const post: MusicPost = {
        id,
        slug,
        title,
        content,
        imageUrls,
        videoUrls,
        tag,
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
  const tag = isValidTag(body.tag) ? body.tag : "Voc.";
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  try {
    return await withKvCollectionLock(KEY, async () => {
      const data = await kv.get<unknown>(KEY);
      const rawPosts = getRawPosts(data);
      const posts = parsePosts(rawPosts);
      const idx = rawPosts.findIndex(
        (post) => isMusicPost(post) && post.id === id
      );
      if (idx === -1) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      const preferredSlug =
        typeof body.slug === "string" && body.slug.trim() ? body.slug : title;
      const slug = makeUniqueSlug(preferredSlug, id, posts, id);
      const post = {
        ...(rawPosts[idx] as MusicPost),
        title,
        content,
        slug,
        imageUrls,
        videoUrls,
        tag,
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
        (post) => !(isMusicPost(post) && post.id === id)
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
