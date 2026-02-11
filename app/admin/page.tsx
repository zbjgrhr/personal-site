import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Admin
      </h1>
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
      </ul>
    </div>
  );
}
