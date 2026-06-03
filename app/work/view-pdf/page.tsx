import Link from "next/link";
import { kv } from "@vercel/kv";

const KEY = "work:posts";

function isHttpsUrl(url: string | null): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function collectSavedPdfUrls(data: unknown): Set<string> {
  const urls = new Set<string>();
  if (!Array.isArray(data)) return urls;

  for (const post of data) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;
    for (const url of pdfUrls) {
      if (typeof url === "string") urls.add(url);
    }
  }

  return urls;
}

async function getTrustedPdfUrl(url: string | null): Promise<string | null> {
  if (!isHttpsUrl(url)) return null;

  try {
    const data = await kv.get<unknown>(KEY);
    return collectSavedPdfUrls(data).has(url) ? url : null;
  } catch {
    return null;
  }
}

export default async function ViewPdfPage({
  searchParams,
}: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const pdfUrl = await getTrustedPdfUrl(url ?? null);

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
          No valid PDF URL provided.
        </p>
      )}
    </article>
  );
}
