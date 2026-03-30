function normalizeKeywordTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, " ");
}

function addWordPrefixes(word: string, out: Set<string>): void {
  for (let i = 1; i <= word.length; i += 1) {
    out.add(word.slice(0, i));
  }
}

export function buildSearchKeywordsFromTags(tags: string[]): string[] {
  const keywords = new Set<string>();

  for (const rawTag of tags) {
    if (typeof rawTag !== "string") continue;

    const normalizedTag = normalizeKeywordTag(rawTag);
    if (!normalizedTag) continue;

    keywords.add(normalizedTag);

    for (const word of normalizedTag.split(" ")) {
      if (!word) continue;
      addWordPrefixes(word, keywords);
    }
  }

  return Array.from(keywords).sort();
}
