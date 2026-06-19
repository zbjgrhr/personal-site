import { kv } from "@vercel/kv";

const WORK_POSTS_KEY = "work:posts";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

function normalizeHttpsUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function getAllowedWorkPdfUrlFromPosts(
  requestedUrl: unknown,
  postsData: unknown
): string | null {
  const normalizedRequestedUrl = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequestedUrl || !Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const { pdfUrls } = post as { pdfUrls?: unknown };
    if (!Array.isArray(pdfUrls)) continue;
    for (const pdfUrl of pdfUrls) {
      if (normalizeHttpsUrl(pdfUrl) === normalizedRequestedUrl) {
        return normalizedRequestedUrl;
      }
    }
  }

  return null;
}

export async function getAllowedWorkPdfUrl(
  requestedUrl: unknown
): Promise<string | null> {
  const normalizedRequestedUrl = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequestedUrl || !hasKvEnv) return null;

  try {
    const postsData = await kv.get<unknown>(WORK_POSTS_KEY);
    return getAllowedWorkPdfUrlFromPosts(normalizedRequestedUrl, postsData);
  } catch {
    return null;
  }
}
