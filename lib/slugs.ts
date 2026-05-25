type SlugRecord = {
  id: string;
  slug: string;
};

export function slugify(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeUniqueSlug(
  source: string,
  posts: SlugRecord[],
  currentId: string,
  fallback: string
): string {
  const base = slugify(source) || slugify(fallback) || "post";
  const usedSlugs = new Set(
    posts.filter((post) => post.id !== currentId).map((post) => post.slug)
  );

  if (!usedSlugs.has(base)) {
    return base;
  }

  let suffix = 2;
  let slug = `${base}-${suffix}`;
  while (usedSlugs.has(slug)) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}
