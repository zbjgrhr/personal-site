export function makePostSlug(input: unknown, title: string, fallbackId: string): string {
  const source = typeof input === "string" && input.trim() ? input : title;
  const slug = source
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallbackId;
}

export function normalizePostSlug(slug: string, fallbackId: string): string {
  return slug.trim() || fallbackId;
}
