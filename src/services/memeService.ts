import type { Meme, MemeQuery } from "../types/meme";

export interface MemeQueryResult {
  items: Meme[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Abstract contract for meme data access.
 * Implementations: FirebaseMemeService (production), MockMemeService (development).
 */
export interface MemeService {
  /** Fetch memes with filtering, sorting, and pagination. */
  queryMemes(query: MemeQuery): Promise<MemeQueryResult>;

  /** Fetch a single meme by ID. */
  getMemeById(id: string): Promise<Meme | null>;

  /** Fetch related memes — same tags or template. */
  getRelatedMemes(meme: Meme, limit?: number): Promise<Meme[]>;

  /** Increment an engagement counter atomically. */
  incrementCounter(
    memeId: string,
    field: "likeCount" | "shareCount" | "downloadCount",
  ): Promise<void>;
}
