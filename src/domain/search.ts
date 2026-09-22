import { sanitizeLikeTerm } from "./slug";

export function searchTokens(query: string): string[] {
  return sanitizeLikeTerm(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function ftsMatchQuery(query: string): string {
  return searchTokens(query)
    .map((token) => `"${token.replaceAll('"', "")}"`)
    .join(" ");
}

export function scoreMatch(haystack: string, tokens: string[]): number {
  const lower = haystack.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower === token) {
      score += 10;
    } else if (lower.startsWith(token)) {
      score += 5;
    } else if (lower.includes(token)) {
      score += 2;
    }
  }
  return score;
}
