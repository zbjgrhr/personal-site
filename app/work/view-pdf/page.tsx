import Link from "next/link";
import { kv } from "@vercel/kv";

const KEY = "work:posts";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

type WorkPostWithPdfs = {
  pdfUrls?: unknown;
};

function isHttpsUrl(url: string | null): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function getStoredPdfUrls(data: unknown): Set<string> {
  if (!Array.isArray(data)) return new Set();

  const urls = data.flatMap((post: WorkPostWithPdfs) =>
    Array.isArray(post.pdfUrls)
      ? post.pdfUrls.filter((url): url is string => typeof url === "string")
      : []
  );

  return new Set(urls);
}

async function isAllowedPdfUrl(url: string | null): Promise<boolean> {
  if (!isHttpsUrl(url) || !hasKvEnv) return false;

  try {
    const data = await kv.get<unknown>(KEY);
    return getStoredPdfUrls(data).has(url);
  } catch (err) {
    console.error("KV get error:", err);
    return false;
  }
}

export default async function ViewPdfPage({
  searchParams,
}: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const valid = await isAllowedPdfUrl(url ?? null);

  return (
    <article className="flex min-h-[80vh] flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          PDF viewer
        </h1>
        {valid && (
          <a
            href={url!}
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
      {valid ? (
        <div className="min-h-[85vh] w-full flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <iframe
            src={url!}
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
