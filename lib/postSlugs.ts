type SluggablePost = {
  id: string;
  slug: string;
};

export function slugify(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createUniqueSlug(
  preferredValue: string,
  fallbackValue: string,
  posts: SluggablePost[],
  currentId?: string
): string {
  const baseSlug = slugify(preferredValue) || slugify(fallbackValue) || "post";
  const usedSlugs = new Set(
    posts
      .filter((post) => post.id !== currentId)
      .map((post) => post.slug)
      .filter(Boolean)
  );

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let slug = `${baseSlug}-${suffix}`;
  while (usedSlugs.has(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  return slug;
}
