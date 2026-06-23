export const WORK_POSTS_KEY = "work:posts";

type WorkPostPdfRecord = {
  pdfUrls?: unknown;
};

export function hasKvEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!env.KV_REST_API_URL && !!env.KV_REST_API_TOKEN;
}

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function getAllowedWorkPdfUrl(
  candidateUrl: string | null | undefined,
  postsData: unknown
): string | null {
  if (typeof candidateUrl !== "string" || !isHttpsUrl(candidateUrl)) {
    return null;
  }
  if (!Array.isArray(postsData)) return null;

  for (const post of postsData) {
    if (!post || typeof post !== "object") continue;
    const { pdfUrls } = post as WorkPostPdfRecord;
    if (!Array.isArray(pdfUrls)) continue;

    const matchingUrl = pdfUrls.find(
      (url): url is string =>
        typeof url === "string" && url === candidateUrl && isHttpsUrl(url)
    );
    if (matchingUrl) return matchingUrl;
  }

  return null;
}
