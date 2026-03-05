/**
 * Generate a URL-friendly slug from a fish name or scientific name
 * @param name The fish name or scientific name
 * @returns A URL-friendly slug
 */
export function generateFishSlug(name: string): string {
  if (!name) return "";

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
