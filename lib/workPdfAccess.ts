export type WorkPdfPost = {
  pdfUrls?: unknown;
};

function normalizeHttpsUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function findAllowedPdfUrl(
  requestedUrl: string | null | undefined,
  postsData: unknown
): string | null {
  const normalizedRequest = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequest || !Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const { pdfUrls } = post as WorkPdfPost;
    if (!Array.isArray(pdfUrls)) continue;

    for (const url of pdfUrls) {
      if (normalizeHttpsUrl(url) === normalizedRequest) {
        return normalizedRequest;
      }
    }
  }

  return null;
}
