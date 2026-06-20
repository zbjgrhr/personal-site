export const WORK_POSTS_KEY = "work:posts";

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function getStoredPdfUrls(postsData: unknown): Set<string> {
  const urls = new Set<string>();
  if (!Array.isArray(postsData)) return urls;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;

    for (const url of pdfUrls) {
      if (typeof url === "string" && isHttpsUrl(url)) {
        urls.add(url);
      }
    }
  }

  return urls;
}

export function getAllowedWorkPdfUrl(
  requestedUrl: string | null | undefined,
  postsData: unknown
): string | null {
  if (typeof requestedUrl !== "string" || !isHttpsUrl(requestedUrl)) {
    return null;
  }

  return getStoredPdfUrls(postsData).has(requestedUrl) ? requestedUrl : null;
}
