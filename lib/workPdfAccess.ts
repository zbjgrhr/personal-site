import { kv } from "@vercel/kv";

const WORK_POSTS_KEY = "work:posts";

function normalizeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getAllowedWorkPdfUrls(data: unknown): Set<string> {
  const urls = new Set<string>();
  if (!Array.isArray(data)) return urls;

  for (const post of data) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;

    for (const rawUrl of pdfUrls) {
      if (typeof rawUrl !== "string") continue;
      const normalized = normalizeHttpsUrl(rawUrl);
      if (normalized) urls.add(normalized);
    }
  }

  return urls;
}

export async function canViewWorkPdfUrl(
  value: string | null | undefined
): Promise<boolean> {
  const normalized = normalizeHttpsUrl(value);
  if (!normalized) return false;

  try {
    const data = await kv.get<unknown>(WORK_POSTS_KEY);
    return getAllowedWorkPdfUrls(data).has(normalized);
  } catch {
    return false;
  }
}
