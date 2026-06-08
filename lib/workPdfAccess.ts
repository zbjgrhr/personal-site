import { kv } from "@vercel/kv";

const WORK_POSTS_KEY = "work:posts";

type WorkPostPdfRecord = {
  pdfUrls?: unknown;
};

function normalizeHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isSavedWorkPdfUrl(
  requestedUrl: string | null | undefined,
  posts: unknown
): boolean {
  const normalizedRequest = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequest || !Array.isArray(posts)) return false;

  return posts.some((post) => {
    if (!post || typeof post !== "object") return false;
    const { pdfUrls } = post as WorkPostPdfRecord;
    if (!Array.isArray(pdfUrls)) return false;

    return pdfUrls.some(
      (url) =>
        typeof url === "string" && normalizeHttpsUrl(url) === normalizedRequest
    );
  });
}

export async function getAuthorizedWorkPdfUrl(
  requestedUrl: string | null | undefined
): Promise<string | null> {
  const normalizedRequest = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequest) return null;

  try {
    const posts = await kv.get<unknown>(WORK_POSTS_KEY);
    return isSavedWorkPdfUrl(normalizedRequest, posts) ? normalizedRequest : null;
  } catch {
    return null;
  }
}
