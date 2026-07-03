export function getAllowedWorkPdfUrl(
  candidateUrl: string | null | undefined,
  postsData: unknown
): string | null {
  if (!candidateUrl || typeof candidateUrl !== "string") return null;

  try {
    const parsed = new URL(candidateUrl);
    if (parsed.protocol !== "https:") return null;
  } catch {
    return null;
  }

  if (!Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;
    if (pdfUrls.some((url) => url === candidateUrl)) return candidateUrl;
  }

  return null;
}
