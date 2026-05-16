export function slugifyPostSlug(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createPostSlug(value: string, fallbackId: string): string {
  return slugifyPostSlug(value) || fallbackId;
}

export function normalizePostSlug(post: {
  id: string;
  slug: string;
  title?: string;
}): string {
  return createPostSlug(post.slug || post.title || "", post.id);
}
