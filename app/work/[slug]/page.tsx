import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import { HoverPlayMedia } from "@/app/music/HoverPlayMedia";

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

async function getPost(slug: string): Promise<WorkPost | null> {
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

export default async function WorkPostPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, admin] = await Promise.all([getPost(slug), isAdmin()]);
  if (!post) notFound();

  const imageItems = post.imageUrls.map((url) => ({ type: "image" as const, url }));
  const videoItems = (post.videoUrls ?? []).map((url) => ({ type: "video" as const, url }));
  const mediaItems = [...imageItems, ...videoItems];
  const firstImage = post.imageUrls[0];
  const firstVideo = post.videoUrls?.[0];
  const heroIndex = firstImage ? 0 : (post.imageUrls?.length ?? 0);
  const remainingMedia = mediaItems.filter((_, i) => i !== heroIndex);

  return (
    <article className="space-y-12 pb-20">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/work"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Works
        </Link>
        {admin && (
          <Link
            href={`/admin/work/edit?id=${encodeURIComponent(post.id)}`}
            className="text-xs text-zinc-600 underline hover:no-underline dark:text-zinc-400"
          >
            Edit post
          </Link>
        )}
      </div>

      <header className="space-y-4">
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

      {(firstImage || firstVideo) && (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {firstImage ? (
            <Image
              src={firstImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 42rem"
              unoptimized
              priority
            />
          ) : (
            <video
              src={firstVideo}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              controls
            />
          )}
        </div>
      )}

      {post.content && (
        <div className="mx-auto max-w-2xl whitespace-pre-line text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          {post.content}
        </div>
      )}

      {(remainingMedia.length > 0 || (post.audioUrls?.length ?? 0) > 0 || (post.pdfUrls?.length ?? 0) > 0 || (post.zipUrls?.length ?? 0) > 0) && (
        <div className="space-y-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          {remainingMedia.length > 0 && (
            <div className="space-y-6">
              {remainingMedia.map((item, i) => (
                <HoverPlayMedia key={i} type={item.type} url={item.url} />
              ))}
            </div>
          )}
          {(post.audioUrls?.length ?? 0) > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                Audio
              </h2>
              <ul className="space-y-4">
                {(post.audioUrls ?? []).map((url, i) => (
                  <li key={i}>
                    <audio
                      src={url}
                      controls
                      className="w-full max-w-xl"
                      preload="metadata"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {((post.pdfUrls?.length ?? 0) > 0 || (post.zipUrls?.length ?? 0) > 0) && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                Documents
              </h2>
              <ul className="space-y-3">
                {(post.pdfUrls ?? []).map((url, i) => (
                  <li key={`pdf-${i}`} className="flex flex-wrap items-center gap-3">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      PDF {i + 1}
                    </span>
                    <Link
                      href={`/work/view-pdf?url=${encodeURIComponent(url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-600 underline hover:no-underline dark:text-zinc-400"
                    >
                      View
                    </Link>
                    <a
                      href={url}
                      download
                      className="text-sm text-zinc-600 underline hover:no-underline dark:text-zinc-400"
                    >
                      Download
                    </a>
                  </li>
                ))}
                {(post.zipUrls ?? []).map((url, i) => (
                  <li key={`zip-${i}`} className="flex flex-wrap items-center gap-3">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Zip {i + 1}
                    </span>
                    <a
                      href={url}
                      download
                      className="text-sm text-zinc-600 underline hover:no-underline dark:text-zinc-400"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
