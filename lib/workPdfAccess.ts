const WORK_POSTS_KEY = "work:posts";

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function getAllowedWorkPdfUrls(data: unknown): Set<string> {
  const urls = new Set<string>();
  if (!Array.isArray(data)) return urls;

  for (const post of data) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;
    for (const url of pdfUrls) {
      if (isHttpsUrl(url)) urls.add(url);
    }
  }

  return urls;
}

export function isAllowedWorkPdfUrl(url: string | null, data: unknown): boolean {
  if (!isHttpsUrl(url)) return false;
  return getAllowedWorkPdfUrls(data).has(url);
}

export async function canViewWorkPdfUrl(url: string | null): Promise<boolean> {
  try {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get<unknown>(WORK_POSTS_KEY);
    return isAllowedWorkPdfUrl(url, data);
  } catch {
    return false;
  }
}
