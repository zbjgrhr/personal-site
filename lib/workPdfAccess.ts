import { kv } from "@vercel/kv";

const WORK_POSTS_KEY = "work:posts";

type PdfAccessClient = {
  get<T = unknown>(key: string): Promise<T | null>;
};

type WorkPdfPost = {
  pdfUrls: string[];
};

function normalizeHttpsUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseWorkPdfPosts(data: unknown): WorkPdfPost[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((post): post is { pdfUrls?: unknown } => !!post && typeof post === "object")
    .map((post) => ({
      pdfUrls: Array.isArray(post.pdfUrls)
        ? post.pdfUrls
            .filter((url): url is string => typeof url === "string")
            .map(normalizeHttpsUrl)
            .filter((url): url is string => !!url)
        : [],
    }));
}

export async function getAllowedWorkPdfUrl(
  rawUrl: string | null | undefined,
  client: PdfAccessClient = kv
): Promise<string | null> {
  const requestedUrl = normalizeHttpsUrl(rawUrl);
  if (!requestedUrl) return null;

  try {
    const data = await client.get<unknown>(WORK_POSTS_KEY);
    const posts = parseWorkPdfPosts(data);
    return posts.some((post) => post.pdfUrls.includes(requestedUrl))
      ? requestedUrl
      : null;
  } catch {
    return null;
  }
}
