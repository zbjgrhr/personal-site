export type WorkPdfClient = {
  get<T = unknown>(key: string): Promise<T | null>;
};

export const WORK_POSTS_KEY = "work:posts";

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function isAllowedWorkPdfUrl(data: unknown, requestedUrl: string | null) {
  if (!requestedUrl || !isHttpsUrl(requestedUrl) || !Array.isArray(data)) {
    return false;
  }

  return data.some((post) => {
    if (!post || typeof post !== "object") return false;
    const pdfUrls = (post as { pdfUrls?: unknown }).pdfUrls;
    return (
      Array.isArray(pdfUrls) &&
      pdfUrls.some((url) => typeof url === "string" && url === requestedUrl)
    );
  });
}

export async function getAllowedWorkPdfUrl(
  client: WorkPdfClient,
  requestedUrl: string | null
): Promise<string | null> {
  if (!requestedUrl) return null;
  const posts = await client.get<unknown>(WORK_POSTS_KEY);
  return isAllowedWorkPdfUrl(posts, requestedUrl) ? requestedUrl : null;
}
