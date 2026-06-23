export const WORK_POSTS_KEY = "work:posts";

type WorkPostPdfRecord = {
  pdfUrls?: unknown;
};

type KvEnv = {
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
};

export function hasKvEnv(env?: KvEnv): boolean {
  const kvUrl = env?.KV_REST_API_URL ?? process.env.KV_REST_API_URL;
  const kvToken = env?.KV_REST_API_TOKEN ?? process.env.KV_REST_API_TOKEN;

  return !!kvUrl && !!kvToken;
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
