import type { MemeService, MemeQueryResult } from "./memeService";
import type { Meme, MemeQuery } from "../types/meme";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where,
  limit as fsLimit,
  startAfter,
  updateDoc,
  increment,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../../firebase";
import { expandTagAliases } from "../utils/tagNormalization";

const PAGE_SIZE = 20;

function mapDoc(docSnap: {
  id: string;
  data: () => Record<string, unknown>;
}): Meme {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = docSnap.data() as Record<string, any>;
  return {
    id: docSnap.id,
    title: data.title ?? "Untitled",
    image: data.imageUrl ?? "",
    height: data.height ?? 300,
    width: data.width ?? 0,
    description: data.description ?? "",
    tags: data.tags ?? [],
    category: data.category ?? "uncategorized",
    templateName: data.templateName ?? "",
    language: data.language ?? "en",
    nsfw: data.nsfw ?? false,
    sensitive: data.sensitive ?? false,
    createdAt:
      data.createdAt?.toDate() ?? data.uploadedAt?.toDate() ?? new Date(),
    likeCount: data.likeCount ?? 0,
    shareCount: data.shareCount ?? 0,
    downloadCount: data.downloadCount ?? 0,
    popularityScore: data.popularityScore ?? 0,
    storagePath: data.storagePath ?? "",
    mimeType: data.mimeType ?? "image/jpeg",
    animated: data.animated ?? false,
    thumbnailUrl: data.thumbnailUrl ?? undefined,
    overlay: data.overlay ?? undefined,
  };
}

export class FirebaseMemeService implements MemeService {
  private memesCol = collection(db, "memes");

  /**
   * Query memes with filtering, sorting, and pagination.
   *
   * Firestore query-composition fallback strategy:
   * ─────────────────────────────────────────────
   * Firestore allows at most ONE array-contains/array-contains-any clause per
   * query. When both `searchText` (array-contains on `searchKeywords`) and
   * `tags` (array-contains-any on `tags`) are requested simultaneously, we
   * cannot express the full intersection server-side.
   *
   * Fallback order:
   *   1. Prefer `searchKeywords array-contains` on the server (narrowest).
   *   2. Apply tag filtering as a client-side post-filter on the returned docs.
   *
   * This guarantees deterministic, correct intersection semantics regardless
   * of which filters are active. The tradeoff is that combined search+tags
   * queries may read more documents than strictly needed; for large datasets
   * consider migrating text search to a dedicated search service (Algolia,
   * Typesense, or Cloud Functions–backed search).
   */
  async queryMemes(q: MemeQuery): Promise<MemeQueryResult> {
    const constraints: QueryConstraint[] = [];
    let clientTagFilter: string[] | null = null;
    const expandedTags = q.tags?.length ? expandTagAliases(q.tags) : null;

    // Category filter (equality — always safe to combine)
    if (q.category) {
      constraints.push(where("category", "==", q.category));
    }

    // Firestore only supports one array-contains* per query.
    // When both search and tags are present, search goes server-side and
    // tags are post-filtered on the client (see fallback docs above).
    const hasSearch = Boolean(q.searchText?.trim());
    const hasTags = Boolean(expandedTags?.length);

    if (hasSearch) {
      constraints.push(
        where(
          "searchKeywords",
          "array-contains",
          q.searchText!.trim().toLowerCase(),
        ),
      );
      if (hasTags) {
        // Cannot combine two array-contains — defer tags to client.
        clientTagFilter = expandedTags!;
      }
    } else if (hasTags) {
      constraints.push(
        where("tags", "array-contains-any", expandedTags!.slice(0, 30)),
      );
    }

    // NSFW exclusion
    if (q.excludeNsfw !== false) {
      constraints.push(where("nsfw", "==", false));
    }

    // Sort
    const sortField =
      q.sortBy === "mostLiked"
        ? "likeCount"
        : q.sortBy === "trending"
          ? "popularityScore"
          : "createdAt";
    constraints.push(orderBy(sortField, "desc"));

    const pageSize = q.limit ?? PAGE_SIZE;

    if (clientTagFilter) {
      // Combined search+tags: Firestore can only handle one array-contains,
      // so tags are post-filtered on the client. We loop internally to
      // guarantee that we either fill a page or prove the server is
      // exhausted — avoiding the dead-end where hasMore=true but
      // nextCursor=null because a single batch yielded zero matches.
      const tagSet = new Set(clientTagFilter);
      const fetchSize = (pageSize + 1) * 3;
      const MAX_ROUNDS = 5;
      const allFilteredItems: Meme[] = [];
      let serverExhausted = false;
      let loopCursor: string | null = q.cursor ?? null;

      for (
        let round = 0;
        round < MAX_ROUNDS &&
        !serverExhausted &&
        allFilteredItems.length <= pageSize;
        round++
      ) {
        const roundConstraints = [...constraints];
        if (loopCursor) {
          const cursorSnap = await getDoc(doc(this.memesCol, loopCursor));
          if (cursorSnap.exists()) {
            roundConstraints.push(startAfter(cursorSnap));
          }
        }
        roundConstraints.push(fsLimit(fetchSize));

        const snapshot = await getDocs(
          query(this.memesCol, ...roundConstraints),
        );
        serverExhausted = snapshot.docs.length < fetchSize;

        const batchItems = snapshot.docs.map(mapDoc);
        const filtered = batchItems.filter((m) =>
          m.tags.some((t) => tagSet.has(t)),
        );
        allFilteredItems.push(...filtered);

        // Advance cursor to last server doc for next round
        if (snapshot.docs.length > 0) {
          loopCursor = snapshot.docs[snapshot.docs.length - 1].id;
        }
      }

      const hasMore = allFilteredItems.length > pageSize || !serverExhausted;
      const pageItems = hasMore
        ? allFilteredItems.slice(0, pageSize)
        : allFilteredItems;

      return {
        items: pageItems,
        nextCursor:
          pageItems.length > 0 ? pageItems[pageItems.length - 1].id : null,
        hasMore,
      };
    }

    // Standard path: single fetch, no client-side filtering needed.
    if (q.cursor) {
      const cursorSnap = await getDoc(doc(this.memesCol, q.cursor));
      if (cursorSnap.exists()) {
        constraints.push(startAfter(cursorSnap));
      }
    }

    const fetchSize = pageSize + 1;
    constraints.push(fsLimit(fetchSize));

    const snapshot = await getDocs(query(this.memesCol, ...constraints));
    const items = snapshot.docs.map(mapDoc);
    const hasMore = items.length > pageSize;
    const pageItems = hasMore ? items.slice(0, pageSize) : items;

    return {
      items: pageItems,
      nextCursor:
        pageItems.length > 0 ? pageItems[pageItems.length - 1].id : null,
      hasMore,
    };
  }

  async getMemeById(id: string): Promise<Meme | null> {
    const snap = await getDoc(doc(db, "memes", id));
    if (!snap.exists()) return null;
    return mapDoc(snap);
  }

  async getRelatedMemes(meme: Meme, limit = 6): Promise<Meme[]> {
    const seen = new Set<string>([meme.id]);
    const results: Meme[] = [];

    // Strategy 1: same template
    if (meme.templateName) {
      const byTemplate = await getDocs(
        query(
          this.memesCol,
          where("templateName", "==", meme.templateName),
          orderBy("popularityScore", "desc"),
          fsLimit(limit + 1),
        ),
      );
      for (const d of byTemplate.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          results.push(mapDoc(d));
        }
      }
    }

    // Strategy 2: overlapping tags
    if (results.length < limit && meme.tags.length > 0) {
      const byTags = await getDocs(
        query(
          this.memesCol,
          where("tags", "array-contains-any", meme.tags.slice(0, 10)),
          orderBy("popularityScore", "desc"),
          fsLimit(limit + 1),
        ),
      );
      for (const d of byTags.docs) {
        if (results.length >= limit) break;
        if (!seen.has(d.id)) {
          seen.add(d.id);
          results.push(mapDoc(d));
        }
      }
    }

    return results.slice(0, limit);
  }

  async incrementCounter(
    memeId: string,
    field: "likeCount" | "shareCount" | "downloadCount",
  ): Promise<void> {
    const ref = doc(db, "memes", memeId);
    await updateDoc(ref, { [field]: increment(1) });
  }
}
