import type { MemeService, MemeQueryResult } from "./memeService";
import type { Meme, MemeQuery } from "../types/meme";
import { mockMemes } from "./mockData";

export class MockMemeService implements MemeService {
  async queryMemes(q: MemeQuery): Promise<MemeQueryResult> {
    // Simulate network latency for realistic loading states
    await new Promise((r) => setTimeout(r, 300));

    let results = [...mockMemes];

    // Text search — mirrors Firebase searchKeywords array-contains behavior:
    // exact keyword match against title words, tags, and category (same
    // semantics as Firestore array-contains on a searchKeywords field).
    if (q.searchText) {
      const trimmed = q.searchText.trim().toLowerCase();
      results = results.filter((m) => {
        const haystack = [
          ...m.title.toLowerCase().split(/\s+/),
          ...m.tags.map((t) => t.toLowerCase()),
          m.category.toLowerCase(),
        ];
        return haystack.some((word) => word === trimmed);
      });
    }

    // Category filter
    if (q.category) {
      results = results.filter((m) => m.category === q.category);
    }

    // Tag filter — applied independently of text search (intersection).
    // Matches if the meme has at least one of the requested tags (OR / union).
    if (q.tags?.length) {
      const tagSet = new Set(q.tags);
      results = results.filter((m) => m.tags.some((t) => tagSet.has(t)));
    }

    // NSFW exclusion
    if (q.excludeNsfw !== false) {
      results = results.filter((m) => !m.nsfw);
    }

    // Sort
    const sortBy = q.sortBy ?? "newest";
    if (sortBy === "newest") {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === "mostLiked") {
      results.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sortBy === "trending") {
      results.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    // Pagination
    const pageSize = q.limit ?? 30;
    const cursorIdx = q.cursor
      ? results.findIndex((m) => m.id === q.cursor) + 1
      : 0;
    const page = results.slice(cursorIdx, cursorIdx + pageSize);
    const hasMore = cursorIdx + pageSize < results.length;

    return {
      items: page,
      nextCursor: page.length > 0 ? page[page.length - 1].id : null,
      hasMore,
    };
  }

  async getMemeById(id: string): Promise<Meme | null> {
    await new Promise((r) => setTimeout(r, 150));
    return mockMemes.find((m) => m.id === id) ?? null;
  }

  async getRelatedMemes(meme: Meme, limit = 6): Promise<Meme[]> {
    await new Promise((r) => setTimeout(r, 200));
    return mockMemes
      .filter(
        (m) =>
          m.id !== meme.id &&
          (m.templateName === meme.templateName ||
            m.tags.some((t) => meme.tags.includes(t))),
      )
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }

  async incrementCounter(
    _memeId: string,
    _field: "likeCount" | "shareCount" | "downloadCount",
  ): Promise<void> {
    // no-op in mock
  }
}
