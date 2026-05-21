export type SluggedPost = {
  id: string;
  slug: string;
};

export function slugify(value: string): string {
  const slug = value
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "post";
}

export function makeUniqueSlug(
  baseSlug: string,
  posts: SluggedPost[],
  currentId?: string
): string {
  const existingSlugs = new Set(
    posts
      .filter((post) => post.id !== currentId)
      .map((post) => post.slug)
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let candidate = `${baseSlug}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  return candidate;
}

export function slugForNewPost(
  title: string,
  posts: SluggedPost[],
  requestedSlug?: unknown
): string {
  const source =
    typeof requestedSlug === "string" && requestedSlug.trim()
      ? requestedSlug
      : title;

  return makeUniqueSlug(slugify(source), posts);
}

export function slugForUpdatedPost(
  currentPost: SluggedPost,
  posts: SluggedPost[],
  requestedSlug?: unknown
): string {
  if (typeof requestedSlug === "string" && requestedSlug.trim()) {
    return makeUniqueSlug(slugify(requestedSlug), posts, currentPost.id);
  }

  return currentPost.slug;
}
