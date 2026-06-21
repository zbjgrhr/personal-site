function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function isAllowedWorkPdfUrl(
  data: unknown,
  candidateUrl: string | null | undefined
): candidateUrl is string {
  if (!candidateUrl || !isHttpsUrl(candidateUrl) || !Array.isArray(data)) {
    return false;
  }

  return data.some((post) => {
    if (!post || typeof post !== "object") return false;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    return (
      Array.isArray(pdfUrls) &&
      pdfUrls.some((url) => typeof url === "string" && url === candidateUrl)
    );
  });
}
