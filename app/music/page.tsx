import Link from "next/link";
import Image from "next/image";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import { getTagStyles } from "@/lib/musicTags";

const KEY = "music:posts";

const VALID_TAGS = ["Voc.", "Wr.", "Aud."] as const;

type MusicPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  tag: string;
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
    .map((p) => {
      const raw = p as MusicPost & { tag?: unknown };
      return {
        ...p,
        videoUrls: Array.isArray(raw.videoUrls)
          ? raw.videoUrls.filter((u): u is string => typeof u === "string")
          : [],
        tag: typeof raw.tag === "string" && VALID_TAGS.includes(raw.tag as (typeof VALID_TAGS)[number])
          ? raw.tag
          : "Voc.",
      };
    });
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function MusicPage() {
  const [posts, admin] = await Promise.all([getPosts(), isAdmin()]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Music
        </h1>
        {admin && (
          <Link
            href="/admin/music/new"
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New post
          </Link>
        )}
      </div>
      <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
        A place for playlists, tracks you love, or anything you&apos;re
        listening to on repeat.
      </p>
      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No posts yet.
        </p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/music/${post.slug}`}
                className="group relative block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              >
                <span
                  className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagStyles(post.tag)}`}
                >
                  {post.tag}
                </span>
                {(post.imageUrls[0] || post.videoUrls[0]) && (
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {post.imageUrls[0] ? (
                      <Image
                        src={post.imageUrls[0]}
                        alt=""
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 42rem"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={post.videoUrls[0]}
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        muted
                        preload="metadata"
                        playsInline
                      />
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
                    {post.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {post.content.slice(0, 160)}
                    {post.content.length > 160 ? "…" : ""}
                  </p>
                  <time
                    dateTime={post.createdAt}
                    className="mt-2 block text-xs text-zinc-500 dark:text-zinc-500"
                  >
                    {formatDate(post.createdAt)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
