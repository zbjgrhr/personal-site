import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import { MUSIC_TAGS, type MusicTag } from "@/lib/musicTags";
import {
  deleteRawPostFromCollection,
  getPostCollectionForWrite,
  InvalidPostCollectionError,
  updateRawPostCollection,
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

type MusicPostRecord = Omit<MusicPost, "tag" | "videoUrls"> & {
  tag?: unknown;
  videoUrls?: unknown;
};

function isMusicPostRecord(p: unknown): p is MusicPostRecord {
  return (
    !!p &&
    typeof p === "object" &&
    typeof (p as MusicPost).id === "string" &&
    typeof (p as MusicPost).slug === "string" &&
    typeof (p as MusicPost).title === "string" &&
    typeof (p as MusicPost).content === "string" &&
    Array.isArray((p as MusicPost).imageUrls) &&
    typeof (p as MusicPost).createdAt === "string"
  );
}

function normalizeMusicPost(p: MusicPostRecord): MusicPost {
  return {
    ...p,
    videoUrls: Array.isArray(p.videoUrls)
      ? p.videoUrls.filter((u): u is string => typeof u === "string")
      : [],
    tag: isValidTag(p.tag) ? p.tag : "Voc.",
  };
}

function parsePosts(data: unknown): MusicPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isMusicPostRecord).map(normalizeMusicPost);
}

function invalidCollectionResponse(err: InvalidPostCollectionError) {
  console.error(err.message);
  return NextResponse.json(
    { error: "Stored posts data is invalid; refusing to overwrite it." },
    { status: 500 }
  );
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
    const data = await kv.get<unknown>(KEY);
    const rawPosts = getPostCollectionForWrite(data, KEY);
    await kv.set(KEY, [post, ...rawPosts]);
    return NextResponse.json({ post });
  } catch (err) {
    if (err instanceof InvalidPostCollectionError) {
      return invalidCollectionResponse(err);
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
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    const data = await kv.get<unknown>(KEY);
    const rawPosts = getPostCollectionForWrite(data, KEY);
    const updated = updateRawPostCollection(
      rawPosts,
      isMusicPostRecord,
      id,
      (post) => ({
        ...normalizeMusicPost(post),
        title,
        content,
        slug,
        imageUrls,
        videoUrls,
        tag,
      })
    );
    if (!updated) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await kv.set(KEY, updated.posts);
    return NextResponse.json({ post: updated.post });
  } catch (err) {
    if (err instanceof InvalidPostCollectionError) {
      return invalidCollectionResponse(err);
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
    const data = await kv.get<unknown>(KEY);
    const rawPosts = getPostCollectionForWrite(data, KEY);
    const deleted = deleteRawPostFromCollection(rawPosts, isMusicPostRecord, id);
    if (deleted.deleted) {
      await kv.set(KEY, deleted.posts);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof InvalidPostCollectionError) {
      return invalidCollectionResponse(err);
    }
    console.error("KV set error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
