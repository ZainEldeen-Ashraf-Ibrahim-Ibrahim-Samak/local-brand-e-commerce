/** URL-safe slug from arbitrary (incl. Arabic) text. Falls back to a timestamp. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || `item-${Date.now()}`;
}
