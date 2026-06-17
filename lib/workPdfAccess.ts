import { kv } from "@vercel/kv";

const WORK_POSTS_KEY = "work:posts";
const hasKvEnv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

function isHttpsUrl(url: string | null): url is string {
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function findAuthorizedWorkPdfUrl(
  postsData: unknown,
  requestedUrl: string | null
): string | null {
  if (!isHttpsUrl(requestedUrl) || !Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (
      Array.isArray(pdfUrls) &&
      pdfUrls.some((url) => typeof url === "string" && url === requestedUrl)
    ) {
      return requestedUrl;
    }
  }

  return null;
}

export async function getAuthorizedWorkPdfUrl(
  requestedUrl: string | null
): Promise<string | null> {
  if (!hasKvEnv) return null;

  try {
    const postsData = await kv.get<unknown>(WORK_POSTS_KEY);
    return findAuthorizedWorkPdfUrl(postsData, requestedUrl);
  } catch {
    return null;
  }
}
