/**
 * Strips raw image URLs and markdown image tags from AI response text.
 * The UI renders images via tool parts, so inline URLs are redundant.
 */
export function sanitizeContent(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]\(https?:\/\/images\.unsplash\.com\/[^)]*\)/g, "")
    .replace(/https?:\/\/images\.unsplash\.com\/\S+/g, "")
    .replace(
      /https?:\/\/[^\s]*supabase\.co\/storage\/v1\/object\/public\/\S+/g,
      ""
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
