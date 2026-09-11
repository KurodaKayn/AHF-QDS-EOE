/**
 * Normalizes text by trimming, converting to lower case,
 * and stripping standard punctuation marks like parentheses and periods.
 * Pure business-agnostic utility.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[()（）。.]/g, "")
    .trim();
}
