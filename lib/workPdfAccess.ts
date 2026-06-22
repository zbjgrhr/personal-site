export type WorkPdfPostRecord = {
  pdfUrls?: unknown;
};

function parseHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function getAuthorizedWorkPdfUrl(
  requestedUrl: string | null | undefined,
  postsData: unknown
): string | null {
  if (!requestedUrl || !parseHttpsUrl(requestedUrl)) return null;
  if (!Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;

    const pdfUrls = (post as WorkPdfPostRecord).pdfUrls;
    if (!Array.isArray(pdfUrls)) continue;

    for (const storedUrl of pdfUrls) {
      if (typeof storedUrl !== "string") continue;
      if (storedUrl === requestedUrl && parseHttpsUrl(storedUrl)) {
        return requestedUrl;
      }
    }
  }

  return null;
}
