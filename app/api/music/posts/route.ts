import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import { MUSIC_TAGS, type MusicTag } from "@/lib/musicTags";
import {
  mutatePostCollection,
  PostCollectionStoreError,
  PostNotFoundError,
} from "@/lib/postCollectionStore";

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

function normalizeMusicPost(post: MusicPost): MusicPost {
  const raw = post as MusicPost & { tag?: unknown };
  return {
    ...post,
    videoUrls: Array.isArray(raw.videoUrls)
      ? raw.videoUrls.filter((u): u is string => typeof u === "string")
      : [],
    tag: isValidTag(raw.tag) ? raw.tag : "Voc.",
  };
}

function parsePosts(data: unknown): MusicPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isMusicPost).map(normalizeMusicPost);
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
  const tag = isValidTag(body.tag) ? body.tag : "Voc.";
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    const post = await mutatePostCollection(KEY, (entries) => {
      let updatedPost: MusicPost | null = null;
      const nextEntries = entries.map((entry) => {
        if (!isMusicPost(entry) || entry.id !== id) return entry;

        updatedPost = {
          ...normalizeMusicPost(entry),
          title,
          content,
          slug,
          imageUrls,
          videoUrls,
          tag,
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
      entries: entries.filter((entry) => !isMusicPost(entry) || entry.id !== id),
      result: true,
    }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mutationErrorResponse(err, "Failed to delete");
  }
}
