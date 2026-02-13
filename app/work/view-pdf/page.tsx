import Link from "next/link";

function isValidPdfUrl(url: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export default async function ViewPdfPage({
  searchParams,
}: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  const valid = isValidPdfUrl(url ?? null);

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
