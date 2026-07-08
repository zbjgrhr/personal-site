export const WORK_POSTS_KEY = "work:posts";

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

function getSavedPdfUrls(postsData: unknown): string[] {
  if (!Array.isArray(postsData)) return [];

  return postsData.flatMap((post) => {
    if (!post || typeof post !== "object") return [];
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) return [];
    return pdfUrls.filter((url): url is string => typeof url === "string");
  });
}

export function findAuthorizedPdfUrl(
  requestedUrl: string | null | undefined,
  postsData: unknown
): string | null {
  const normalizedRequest = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequest) return null;

  for (const savedUrl of getSavedPdfUrls(postsData)) {
    if (normalizeHttpsUrl(savedUrl) === normalizedRequest) {
      return savedUrl;
    }
  }

  return null;
}
