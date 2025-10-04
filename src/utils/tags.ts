// src/utils/tags.ts

/** Normalize a single tag (trim, collapse spaces, lowercase). */
export function normalizeTag(input: any): string {
  if (input == null) return "";
  const s = String(input).trim();
  if (!s) return "";
  return s.replace(/\s+/g, " ").toLowerCase();
}

/** Split only by commas. Never split on spaces. */
export function splitCommaTags(input: any): string[] {
  if (input == null) return [];
  if (Array.isArray(input)) return input.flatMap((v) => splitCommaTags(v));
  return String(input)
    .split(",")        // ← ONLY commas
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Normalize to unique, lowercased tags (comma-based). */
export function normalizeTags(input: any): string[] {
  const arr = Array.isArray(input) ? input : splitCommaTags(input);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of arr) {
    const n = normalizeTag(t);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}
