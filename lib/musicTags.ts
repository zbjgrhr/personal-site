/**
 * Music post tags: Voc. / Wr. / Aud.
 * Shared by API route and client components (admin forms) so client never imports API route.
 */
export const MUSIC_TAGS = ["Voc.", "Wr.", "Aud."] as const;
export type MusicTag = (typeof MUSIC_TAGS)[number];

/**
 * Tailwind class for Music post tag pills (Voc. / Wr. / Aud.).
 * Use for both list and detail pages.
 */
export function getTagStyles(tag: string): string {
  switch (tag) {
    case "Wr.":
      return "bg-emerald-500/90 text-white dark:bg-emerald-500/90 dark:text-white";
    case "Aud.":
      return "bg-sky-500/90 text-white dark:bg-sky-500/90 dark:text-white";
    default:
      return "bg-amber-500/90 text-white dark:bg-amber-500/90 dark:text-white";
  }
}
