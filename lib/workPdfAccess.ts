import { kv } from "@vercel/kv";

const WORK_POSTS_KEY = "work:posts";

function hasKvEnv(): boolean {
  return !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
}

export function normalizeHttpsUrlForWorkPdf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function collectAllowedWorkPdfUrls(data: unknown): Set<string> {
  const allowed = new Set<string>();
  if (!Array.isArray(data)) return allowed;

  for (const post of data) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;

    for (const url of pdfUrls) {
      if (typeof url !== "string") continue;
      const normalized = normalizeHttpsUrlForWorkPdf(url);
      if (normalized) allowed.add(normalized);
    }
  }

  return allowed;
}

export async function getAllowedWorkPdfUrl(
  url: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeHttpsUrlForWorkPdf(url);
  if (!normalized || !hasKvEnv()) return null;

  try {
    const data = await kv.get<unknown>(WORK_POSTS_KEY);
    return collectAllowedWorkPdfUrls(data).has(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
