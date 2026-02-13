"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  imageUrls: string[];
  videoUrls?: string[];
  tag?: string;
  createdAt: string;
};

export function AdminMusicList({ posts }: { posts: Post[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/music/posts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  if (posts.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        No posts. Create one from &quot;New post&quot;.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex items-center justify-between rounded border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
        >
          <div className="min-w-0 flex-1">
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {post.title}
            </span>
            <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-500">
              /{post.slug}
            </span>
          </div>
          <div className="ml-4 flex gap-2">
            <Link
              href={`/admin/music/edit?id=${encodeURIComponent(post.id)}`}
              className="text-sm text-zinc-600 underline hover:no-underline dark:text-zinc-400"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(post.id)}
              className="text-sm text-red-600 hover:underline dark:text-red-400"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
