import Link from "next/link";
import Image from "next/image";
import { kv } from "@vercel/kv";
import { isAdmin } from "@/lib/auth";

const KEY = "blog:posts";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

function parsePosts(data: unknown): BlogPost[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (p): p is BlogPost =>
      p &&
      typeof p === "object" &&
      typeof (p as BlogPost).id === "string" &&
      typeof (p as BlogPost).slug === "string" &&
      typeof (p as BlogPost).title === "string" &&
      typeof (p as BlogPost).content === "string" &&
      Array.isArray((p as BlogPost).imageUrls) &&
      typeof (p as BlogPost).createdAt === "string"
  );
}

async function getPosts(): Promise<BlogPost[]> {
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

export default async function BlogPage() {
  const [posts, admin] = await Promise.all([getPosts(), isAdmin()]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Blog
        </h1>
        {admin && (
          <Link
            href="/admin/blog/new"
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New post
          </Link>
        )}
      </div>
      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">
          No posts yet.
        </p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              >
                {post.imageUrls[0] && (
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={post.imageUrls[0]}
                      alt=""
                      fill
                      className="object-cover transition group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 42rem"
                      unoptimized
                    />
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
