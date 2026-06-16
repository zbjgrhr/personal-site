export const WORK_POSTS_KEY = "work:posts";

type WorkPostWithPdfUrls = {
  pdfUrls?: unknown;
};

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function isAllowedWorkPdfUrl(url: string | null | undefined, data: unknown): boolean {
  if (!url || !isHttpsUrl(url) || !Array.isArray(data)) return false;

  return data.some((post) => {
    if (!post || typeof post !== "object") return false;
    const { pdfUrls } = post as WorkPostWithPdfUrls;
    return Array.isArray(pdfUrls) && pdfUrls.some((savedUrl) => savedUrl === url);
  });
}
