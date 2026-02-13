import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin
        </h1>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="text-sm text-zinc-600 underline hover:no-underline dark:text-zinc-400"
          >
            Logout
          </button>
        </form>
      </div>
      <ul className="list-inside list-disc space-y-2 text-zinc-600 dark:text-zinc-400">
        <li>
          <Link
            href="/admin/about"
            className="underline hover:no-underline"
          >
            Edit About photo
          </Link>
        </li>
        <li>
          <Link
            href="/admin/blog"
            className="underline hover:no-underline"
          >
            Manage Blog posts
          </Link>
        </li>
        <li>
          <Link
            href="/admin/music"
            className="underline hover:no-underline"
          >
            Manage Music posts
          </Link>
        </li>
        <li>
          <Link
            href="/admin/work"
            className="underline hover:no-underline"
          >
            Manage Work posts
          </Link>
        </li>
      </ul>
    </div>
  );
}
