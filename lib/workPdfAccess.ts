function normalizeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function findAllowedWorkPdfUrl(
  postsData: unknown,
  requestedUrl: string | null | undefined
): string | null {
  const normalizedRequestedUrl = normalizeHttpsUrl(requestedUrl);
  if (!normalizedRequestedUrl || !Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;

    for (const pdfUrl of pdfUrls) {
      const normalizedPdfUrl = normalizeHttpsUrl(pdfUrl);
      if (normalizedPdfUrl === normalizedRequestedUrl) {
        return normalizedRequestedUrl;
      }
    }
  }

  return null;
}
