import { notFound } from "next/navigation";
import Link from "next/link";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import { getTagStyles } from "@/lib/musicTags";
import { HoverPlayMedia } from "../HoverPlayMedia";

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

async function getPost(slug: string): Promise<MusicPost | null> {
  try {
    const data = await kv.get<unknown>(KEY);
    const posts = parsePosts(data ?? []);
    return posts.find((p) => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function MusicPostPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, admin] = await Promise.all([getPost(slug), isAdmin()]);
  if (!post) notFound();

  const mediaItems: { type: "image" | "video"; url: string }[] = [
    ...post.imageUrls.map((url) => ({ type: "image" as const, url })),
    ...(post.videoUrls ?? []).map((url) => ({ type: "video" as const, url })),
  ];

  return (
    <article className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/music"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Music
        </Link>
        {admin && (
          <Link
            href={`/admin/music/edit?id=${encodeURIComponent(post.id)}`}
            className="text-xs text-zinc-600 underline hover:no-underline dark:text-zinc-400"
          >
            Edit post
          </Link>
        )}
      </div>
      <header className="space-y-4">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getTagStyles(post.tag)}`}
        >
          {post.tag}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
          {post.title}
        </h1>
        <time
          dateTime={post.createdAt}
          className="block text-sm text-zinc-500 dark:text-zinc-500"
        >
          {formatDate(post.createdAt)}
        </time>
      </header>
      {mediaItems.length > 0 && (
        <div className="space-y-4">
          {mediaItems.map((item, i) => (
            <HoverPlayMedia key={i} type={item.type} url={item.url} />
          ))}
        </div>
      )}
      <div className="whitespace-pre-line text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
        {post.content}
      </div>
    </article>
  );
}
