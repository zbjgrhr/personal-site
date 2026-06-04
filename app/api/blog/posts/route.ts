import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import {
  mutatePostCollection,
  PostCollectionStoreError,
  PostNotFoundError,
} from "@/lib/postCollectionStore";

const KEY = "blog:posts";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

function isBlogPost(post: unknown): post is BlogPost {
  return (
    !!post &&
    typeof post === "object" &&
    typeof (post as BlogPost).id === "string" &&
    typeof (post as BlogPost).slug === "string" &&
    typeof (post as BlogPost).title === "string" &&
    typeof (post as BlogPost).content === "string" &&
    Array.isArray((post as BlogPost).imageUrls) &&
    typeof (post as BlogPost).createdAt === "string"
  );
}

function parsePosts(data: unknown): BlogPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isBlogPost);
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
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = new Date().toISOString();
  const post: BlogPost = { id, slug, title, content, imageUrls, createdAt };
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
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().replace(/\s+/g, "-").toLowerCase()
      : title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    const post = await mutatePostCollection(KEY, (entries) => {
      let updatedPost: BlogPost | null = null;
      const nextEntries = entries.map((entry) => {
        if (!isBlogPost(entry) || entry.id !== id) return entry;

        updatedPost = {
          ...entry,
          title,
          content,
          slug,
          imageUrls,
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
      entries: entries.filter((entry) => !isBlogPost(entry) || entry.id !== id),
      result: true,
    }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return mutationErrorResponse(err, "Failed to delete");
  }
}
