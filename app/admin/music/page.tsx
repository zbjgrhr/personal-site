import Link from "next/link";
import { kv } from "@vercel/kv";
import { AdminMusicList } from "./AdminMusicList";

const KEY = "music:posts";

type MusicPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  tag?: string;
  createdAt: string;
};

function parsePosts(data: unknown): MusicPost[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (p): p is MusicPost =>
        p &&
        typeof p === "object" &&
        typeof (p as MusicPost).id === "string" &&
        typeof (p as MusicPost).slug === "string" &&
        typeof (p as MusicPost).title === "string" &&
        typeof (p as MusicPost).content === "string" &&
        Array.isArray((p as MusicPost).imageUrls) &&
        typeof (p as MusicPost).createdAt === "string"
    )
    .map((p) => ({
      ...p,
      videoUrls: Array.isArray((p as MusicPost).videoUrls)
        ? (p as MusicPost).videoUrls.filter((u): u is string => typeof u === "string")
        : [],
    }));
}

async function getPosts(): Promise<MusicPost[]> {
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []);
    posts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    return posts;
  } catch {
    return [];
  }
}

export default async function AdminMusicPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Music posts
        </h1>
        <Link
          href="/admin/music/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New post
        </Link>
      </div>
      <AdminMusicList posts={posts} />
    </div>
  );
}
