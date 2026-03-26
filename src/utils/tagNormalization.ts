const TAG_ALIAS_GROUPS = [
  ["dance", "dancing"],
] as const;

const TAG_ALIAS_MAP = new Map<string, readonly string[]>(
  TAG_ALIAS_GROUPS.flatMap((group) =>
    group.map((tag) => [tag, group] as const),
  ),
);

function cleanTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, "");
}

export function canonicalizeTag(tag: string): string {
  const cleaned = cleanTag(tag);
  const aliases = TAG_ALIAS_MAP.get(cleaned);
  return aliases?.[0] ?? cleaned;
}

export function expandTagAliases(tags: readonly string[]): string[] {
  const expanded = new Set<string>();

  for (const tag of tags) {
    const canonical = canonicalizeTag(tag);
    expanded.add(canonical);

    const aliases = TAG_ALIAS_MAP.get(canonical);
    if (aliases) {
      for (const alias of aliases) {
        expanded.add(alias);
      }
    }
  }

  return Array.from(expanded);
}

export function normalizeTagList(tags: readonly string[]): string[] {
  const normalized = new Set<string>();

  for (const tag of tags) {
    const canonical = canonicalizeTag(tag);
    if (canonical) {
      normalized.add(canonical);
    }
  }

  return Array.from(normalized);
}
