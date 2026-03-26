import { describe, it, expect, beforeEach } from "vitest";
import { MockMemeService } from "./mockMemeService";
import type { MemeService, MemeQueryResult } from "./memeService";
import type { MemeQuery } from "../types/meme";

/**
 * Contract tests for the MemeService `queryMemes` method.
 *
 * These tests run against MockMemeService, which mirrors the Firebase
 * query semantics (search + tags intersection, OR tag matching,
 * category equality filter, sort, pagination, NSFW exclusion).
 *
 * The same logical tests should hold for FirebaseMemeService against
 * a real or emulated Firestore instance.
 */

let service: MemeService;

beforeEach(() => {
  service = new MockMemeService();
});

// ─── Helpers ────────────────────────────────────────────────────────

async function queryIds(q: MemeQuery): Promise<string[]> {
  const result = await service.queryMemes(q);
  return result.items.map((m) => m.id);
}

async function queryResult(q: MemeQuery): Promise<MemeQueryResult> {
  return service.queryMemes(q);
}

// ─── Search Only ────────────────────────────────────────────────────

describe("queryMemes — search only", () => {
  it("returns all items when no filters are set", async () => {
    const result = await queryResult({});
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.hasMore).toBe(false);
  });

  it("filters by search text (exact keyword match)", async () => {
    const ids = await queryIds({ searchText: "drake" });
    expect(ids).toContain("2"); // Drake Hotline Bling
    // Should not contain items without "drake"
    expect(ids).not.toContain("1"); // Distracted Boyfriend
  });

  it("search is case-insensitive", async () => {
    const lower = await queryIds({ searchText: "pikachu" });
    const upper = await queryIds({ searchText: "PIKACHU" });
    expect(lower).toEqual(upper);
  });

  it("returns empty when search matches nothing", async () => {
    const ids = await queryIds({ searchText: "xyznonexistent" });
    expect(ids).toHaveLength(0);
  });
});

// ─── Tags Only ──────────────────────────────────────────────────────

describe("queryMemes — tags only", () => {
  it("filters by a single tag (OR matching)", async () => {
    const ids = await queryIds({ tags: ["cat"] });
    expect(ids).toContain("7"); // Woman Yelling at Cat
  });

  it("filters by multiple tags (OR / union)", async () => {
    const ids = await queryIds({ tags: ["cat", "doge"] });
    expect(ids).toContain("7"); // Woman Yelling at Cat — has "cat"
    expect(ids).toContain("12"); // Buff Doge vs Cheems — has "doge"
  });

  it("returns empty when no items match the tag", async () => {
    const ids = await queryIds({ tags: ["nonexistenttag"] });
    expect(ids).toHaveLength(0);
  });

  it("matches tag aliases against canonical stored tags", async () => {
    const ids = await queryIds({ tags: ["dancing"] });
    expect(ids).toContain("2");
  });
});

// ─── Search + Tags Intersection ─────────────────────────────────────

describe("queryMemes — search ∩ tags", () => {
  it("returns only items matching BOTH search and tags", async () => {
    // "reaction" tag + "drake" search should only return Drake meme
    const ids = await queryIds({ searchText: "drake", tags: ["reaction"] });
    expect(ids).toContain("2"); // Drake has tag "reaction" + title "Drake"
    // Surprised Pikachu has "reaction" tag but title doesn't start with "drake"
    expect(ids).not.toContain("9");
  });

  it("returns empty when search matches but tags don't", async () => {
    const ids = await queryIds({ searchText: "drake", tags: ["cat"] });
    expect(ids).toHaveLength(0);
  });

  it("returns empty when tags match but search doesn't", async () => {
    const ids = await queryIds({
      searchText: "xyznonexistent",
      tags: ["reaction"],
    });
    expect(ids).toHaveLength(0);
  });
});

// ─── Category Filter ────────────────────────────────────────────────

describe("queryMemes — category", () => {
  it("filters by category", async () => {
    const result = await queryResult({ category: "animals" });
    expect(result.items.every((m) => m.category === "animals")).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("category + search intersection works", async () => {
    const ids = await queryIds({
      category: "reaction",
      searchText: "drake",
    });
    expect(ids).toContain("2");
    // Distracted Boyfriend is "classic", not "reaction"
    expect(ids).not.toContain("1");
  });

  it("category + tags intersection works", async () => {
    // All results should be category=reaction AND have "reaction" tag
    const result = await queryResult({
      category: "reaction",
      tags: ["reaction"],
    });
    for (const item of result.items) {
      expect(item.category).toBe("reaction");
      expect(item.tags).toContain("reaction");
    }
  });
});

// ─── Category + Search + Tags Triple Combo ──────────────────────────

describe("queryMemes — category + search + tags", () => {
  it("intersects all three filters", async () => {
    const result = await queryResult({
      category: "reaction",
      searchText: "drake",
      tags: ["approve"],
    });
    // Only Drake Hotline Bling matches all three
    expect(result.items.map((m) => m.id)).toEqual(["2"]);
  });
});

// ─── Sorting ────────────────────────────────────────────────────────

describe("queryMemes — sorting", () => {
  it("sorts by newest (createdAt desc)", async () => {
    const result = await queryResult({ sortBy: "newest" });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.items[i].createdAt.getTime(),
      );
    }
  });

  it("sorts by most liked (likeCount desc)", async () => {
    const result = await queryResult({ sortBy: "mostLiked" });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i - 1].likeCount).toBeGreaterThanOrEqual(
        result.items[i].likeCount,
      );
    }
  });

  it("sorts by trending (popularityScore desc)", async () => {
    const result = await queryResult({ sortBy: "trending" });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i - 1].popularityScore).toBeGreaterThanOrEqual(
        result.items[i].popularityScore,
      );
    }
  });
});

// ─── Pagination ─────────────────────────────────────────────────────

describe("queryMemes — pagination", () => {
  it("respects limit and returns hasMore correctly", async () => {
    const result = await queryResult({ limit: 3 });
    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
  });

  it("cursor-based pagination returns next page", async () => {
    const page1 = await queryResult({ limit: 3 });
    const page2 = await queryResult({
      limit: 3,
      cursor: page1.nextCursor!,
    });
    // No overlap between pages
    const page1Ids = new Set(page1.items.map((m) => m.id));
    for (const item of page2.items) {
      expect(page1Ids.has(item.id)).toBe(false);
    }
  });

  it("returns hasMore=false when fewer items than limit", async () => {
    const result = await queryResult({ limit: 100 });
    expect(result.hasMore).toBe(false);
  });
});

// ─── NSFW Exclusion ─────────────────────────────────────────────────

describe("queryMemes — NSFW exclusion", () => {
  it("excludes NSFW by default", async () => {
    const result = await queryResult({});
    expect(result.items.every((m) => !m.nsfw)).toBe(true);
  });

  it("includes NSFW when excludeNsfw=false", async () => {
    // All mock items happen to be nsfw=false, so result should be same
    const included = await queryResult({ excludeNsfw: false });
    const excluded = await queryResult({ excludeNsfw: true });
    expect(included.items.length).toBeGreaterThanOrEqual(excluded.items.length);
  });
});

// ─── Pagination Invariants ──────────────────────────────────────────

describe("queryMemes — pagination invariants", () => {
  it("never returns hasMore=true with nextCursor=null", async () => {
    // Verify the invariant for search+tags (the combined-filter path)
    const result = await queryResult({
      searchText: "drake",
      tags: ["reaction"],
      limit: 1,
    });
    if (result.hasMore) {
      expect(result.nextCursor).not.toBeNull();
    }
  });

  it("returns consistent state when search+tags yields no matches", async () => {
    const result = await queryResult({
      searchText: "drake",
      tags: ["nonexistenttag"],
    });
    // No matches → hasMore must be false
    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});

// ─── getRelatedMemes ────────────────────────────────────────────────

describe("getRelatedMemes", () => {
  it("returns related memes excluding the source meme", async () => {
    const meme = (await service.getMemeById("1"))!;
    const related = await service.getRelatedMemes(meme, 4);
    expect(related.every((m) => m.id !== meme.id)).toBe(true);
  });

  it("related memes share tags or template with source", async () => {
    const meme = (await service.getMemeById("7"))!; // Woman Yelling at Cat — tags: cat, yelling, dinner, funny
    const related = await service.getRelatedMemes(meme, 6);
    for (const r of related) {
      const sharesTag = r.tags.some((t) => meme.tags.includes(t));
      const sharesTemplate = r.templateName === meme.templateName;
      expect(sharesTag || sharesTemplate).toBe(true);
    }
  });

  it("respects limit", async () => {
    const meme = (await service.getMemeById("1"))!;
    const related = await service.getRelatedMemes(meme, 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });
});

// ─── getMemeById ────────────────────────────────────────────────────

describe("getMemeById", () => {
  it("returns the correct meme for a valid ID", async () => {
    const meme = await service.getMemeById("1");
    expect(meme).not.toBeNull();
    expect(meme!.id).toBe("1");
    expect(meme!.title).toBe("Distracted Boyfriend");
  });

  it("returns null for a non-existent ID", async () => {
    const meme = await service.getMemeById("999");
    expect(meme).toBeNull();
  });
});
