export type ExistingSlug = {
  id: string;
  slug: string;
};

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeUniqueSlug(
  preferred: string,
  fallback: string,
  existing: ExistingSlug[],
  currentId?: string
): string {
  const base = slugify(preferred) || slugify(fallback) || "post";
  const used = new Set(
    existing
      .filter((post) => post.id !== currentId)
      .map((post) => post.slug)
      .filter(Boolean)
  );

  if (!used.has(base)) return base;

  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
