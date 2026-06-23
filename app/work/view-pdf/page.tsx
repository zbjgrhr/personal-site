import Link from "next/link";
import { kv } from "@vercel/kv";
import {
  getAllowedWorkPdfUrl,
  hasKvEnv,
  WORK_POSTS_KEY,
} from "@/lib/workPdfAccess";

export const dynamic = "force-dynamic";

async function getAuthorizedPdfUrl(url: string | null): Promise<string | null> {
  if (!hasKvEnv()) return null;

  try {
    const data = await kv.get<unknown>(WORK_POSTS_KEY);
    return getAllowedWorkPdfUrl(url, data);
  } catch {
    return null;
  }
}

export default async function ViewPdfPage({
  searchParams,
}: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const pdfUrl = await getAuthorizedPdfUrl(url ?? null);

  return (
    <article className="flex min-h-[80vh] flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          PDF viewer
        </h1>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download
            className="text-sm text-zinc-600 underline hover:no-underline dark:text-zinc-400"
          >
            Download
          </a>
        )}
        <Link
          href="/work"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Works
        </Link>
      </div>
      {pdfUrl ? (
        <div className="min-h-[85vh] w-full flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <iframe
            src={pdfUrl}
            title="PDF"
            className="h-[85vh] w-full min-h-[600px]"
          />
        </div>
      ) : (
        <p className="py-8 text-zinc-600 dark:text-zinc-400">
          No authorized PDF URL provided.
        </p>
      )}
    </article>
  );
}
