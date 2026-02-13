import Link from "next/link";
import Image from "next/image";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const KEY = "work:posts";

type WorkPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
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

export default async function WorkPage() {
  const [posts, admin] = await Promise.all([getPosts(), isAdmin()]);

  return (
    <article className="space-y-16 pb-16">
      <blockquote
        className={`${playfair.className} border-l-4 border-zinc-300 pl-6 py-2 text-2xl italic leading-snug text-zinc-700 dark:border-zinc-600 dark:text-zinc-300 md:text-3xl`}
      >
        Artificial intelligence is not a tool.
        <br />
        It is a collaborator.
      </blockquote>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
            Works
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Selected projects, experiments, and collaborations.
          </p>
        </div>
        {admin && (
          <Link
            href="/admin/work/new"
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New post
          </Link>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="py-12 text-zinc-600 dark:text-zinc-400">
          No works yet.
        </p>
      ) : (
        <ul className="space-y-20">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-zinc-200 pb-20 last:border-0 dark:border-zinc-800">
              <Link
                href={`/work/${post.slug}`}
                className="group block"
              >
                {(post.imageUrls[0] || post.videoUrls[0]) && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 mb-8">
                    {post.imageUrls[0] ? (
                      <Image
                        src={post.imageUrls[0]}
                        alt=""
                        fill
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 42rem"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={post.videoUrls[0]}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        muted
                        preload="metadata"
                        playsInline
                      />
                    )}
                  </div>
                )}
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl group-hover:underline">
                  {post.title}
                </h2>
                {post.content && (
                  <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {post.content.slice(0, 200)}
                    {post.content.length > 200 ? "…" : ""}
                  </p>
                )}
                <time
                  dateTime={post.createdAt}
                  className="mt-4 block text-sm text-zinc-500 dark:text-zinc-500"
                >
                  {formatDate(post.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
