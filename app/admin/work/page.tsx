import Link from "next/link";
import { kv } from "@vercel/kv";
import { AdminWorkList } from "./AdminWorkList";

const KEY = "work:posts";

type WorkPost = {
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

async function getPosts(): Promise<WorkPost[]> {
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []);
    posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return posts;
  } catch {
    return [];
  }
}

export default async function AdminWorkPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Work posts
        </h1>
        <Link
          href="/admin/work/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New post
        </Link>
      </div>
      <AdminWorkList posts={posts} />
    </div>
  );
}
