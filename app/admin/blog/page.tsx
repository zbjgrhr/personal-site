import Link from "next/link";
import { kv } from "@vercel/kv";
import { AdminBlogList } from "./AdminBlogList";

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

export default async function AdminBlogPage() {
  const posts = await getPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Blog posts
        </h1>
        <Link
          href="/admin/blog/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New post
        </Link>
      </div>
      <AdminBlogList posts={posts} />
    </div>
  );
}
