export function resolveUpdatedSlug(
  requestedSlug: unknown,
  currentSlug: string
): string {
  if (typeof requestedSlug !== "string" || !requestedSlug.trim()) {
    return currentSlug;
  }

  return requestedSlug.trim().replace(/\s+/g, "-").toLowerCase();
}
