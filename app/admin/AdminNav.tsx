"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <Link
        href="/admin"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Admin
      </Link>
      <Link
        href="/admin/about"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        About photo
      </Link>
      <Link
        href="/admin/blog"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Blog
      </Link>
      <Link
        href="/admin/music"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Music
      </Link>
      <Link
        href="/admin/work"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Work
      </Link>
      <form action="/api/auth/logout" method="POST" className="ml-auto">
        <button
          type="submit"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 dark:hover:text-zinc-200"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
