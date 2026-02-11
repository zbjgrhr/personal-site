import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { kv } from "@vercel/kv";

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

async function getPost(slug: string): Promise<BlogPost | null> {
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

export default async function BlogPostPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="space-y-8">
      <Link
        href="/blog"
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        ← Blog
      </Link>
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
      {post.imageUrls.length > 0 && (
        <div className="space-y-4">
          {post.imageUrls.map((url, i) => (
            <div
              key={i}
              className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 42rem"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}
      <div className="whitespace-pre-line text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
        {post.content}
      </div>
    </article>
  );
}
