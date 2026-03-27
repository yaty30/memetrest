import { useState, useEffect, useCallback, useRef } from "react";
import type { Meme, MemeQuery } from "../types/meme";
import type { DiscoveryFilters } from "../types/discovery";
import { memeService } from "../services";

const PAGE_SIZE = 20;

interface PaginatedMemesState {
  items: Meme[];
  loadingInitial: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

export interface UsePaginatedMemesReturn extends PaginatedMemesState {
  /** Ref callback — attach to a sentinel element at the bottom of the list */
  sentinelRef: (node: HTMLElement | null) => void;
  /** Ref callback — attach to the scroll container (needed for IntersectionObserver root) */
  scrollContainerRef: (node: HTMLElement | null) => void;
  /** Manually trigger next-page load (useful for retry after error) */
  loadMore: () => void;
  /** True when the error occurred during pagination (items already visible) */
  paginationError: boolean;
}

/**
 * Reusable hook for Firestore cursor-based pagination with infinite scroll.
 *
 * Pagination strategy:
 * - Uses Firestore `orderBy` + `startAfter(docSnapshot)` for stable cursor pagination.
 * - Default sort: `createdAt desc` (deterministic with Firestore's implicit __name__ tiebreaker).
 * - Fetches PAGE_SIZE items per request; the service over-fetches by 1 to derive `hasMore`.
 *
 * Race-condition protection:
 * - A generation counter (`generationRef`) is incremented on every filter/search change.
 * - Stale responses (where the captured generation differs from current) are discarded.
 *
 * Reset behavior:
 * - Any change to `searchQuery` or `filters` resets items, cursor, and loading state,
 *   then fetches the first page of the new query.
 *
 * Deduplication:
 * - Before appending a new page, existing item IDs are checked to prevent duplicates.
 */
export function usePaginatedMemes(
  searchQuery = "",
  filters?: DiscoveryFilters,
): UsePaginatedMemesReturn {
  const [state, setState] = useState<PaginatedMemesState>({
    items: [],
    loadingInitial: true,
    loadingMore: false,
    hasMore: false,
    error: null,
  });

  // Cursor for Firestore startAfter pagination
  const cursorRef = useRef<string | null>(null);
  // Generation counter — guards against stale responses after filter changes
  const generationRef = useRef(0);
  // Prevents duplicate loadMore calls while one is in-flight
  const loadingMoreRef = useRef(false);
  // IntersectionObserver instance
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Tracked nodes for observer setup
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const scrollContainerNodeRef = useRef<HTMLElement | null>(null);

  /* ── Build query from search + filters ── */
  const buildQuery = useCallback(
    (cursor?: string): MemeQuery => ({
      searchText: searchQuery || undefined,
      tags: filters?.activeTags.length ? filters.activeTags : undefined,
      category: filters?.activeCategory ?? undefined,
      sortBy: filters?.sortBy ?? "newest",
      excludeNsfw: filters?.excludeNsfw ?? true,
      limit: PAGE_SIZE,
      cursor,
    }),
    [searchQuery, filters],
  );

  /* ── Reset + fetch first page when query/filters change ── */
  useEffect(() => {
    const gen = ++generationRef.current;
    cursorRef.current = null;
    loadingMoreRef.current = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      items: [],
      loadingInitial: true,
      loadingMore: false,
      hasMore: false,
      error: null,
    });

    memeService
      .queryMemes(buildQuery())
      .then((result) => {
        // Stale guard: discard if filters changed while this was in-flight
        if (gen !== generationRef.current) return;
        setState({
          items: result.items,
          loadingInitial: false,
          loadingMore: false,
          hasMore: result.hasMore,
          error: null,
        });
        cursorRef.current = result.nextCursor;
      })
      .catch((err) => {
        if (gen !== generationRef.current) return;
        setState({
          items: [],
          loadingInitial: false,
          loadingMore: false,
          hasMore: false,
          error: err instanceof Error ? err.message : "Failed to load images",
        });
      });
  }, [buildQuery]);

  /* ── Load next page ── */
  const loadMore = useCallback(() => {
    if (!cursorRef.current || loadingMoreRef.current) return;

    const gen = generationRef.current;
    loadingMoreRef.current = true;

    setState((prev) => ({ ...prev, loadingMore: true, error: null }));

    memeService
      .queryMemes(buildQuery(cursorRef.current))
      .then((result) => {
        if (gen !== generationRef.current) return; // stale

        setState((prev) => {
          // Deduplicate by document ID before merging pages
          const existingIds = new Set(prev.items.map((m) => m.id));
          const newItems = result.items.filter((m) => !existingIds.has(m.id));

          return {
            ...prev,
            items: [...prev.items, ...newItems],
            loadingMore: false,
            hasMore: result.hasMore,
            error: null,
          };
        });
        cursorRef.current = result.nextCursor;
      })
      .catch((err) => {
        if (gen !== generationRef.current) return;
        setState((prev) => ({
          ...prev,
          loadingMore: false,
          error: err instanceof Error ? err.message : "Failed to load more",
        }));
      })
      .finally(() => {
        loadingMoreRef.current = false;
      });
  }, [buildQuery]);

  /* ── Set up / tear down IntersectionObserver when nodes change ── */
  const setupObserver = useCallback(() => {
    // Always clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const sentinel = sentinelNodeRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        // Use scroll container as root so the sentinel triggers relative to
        // the actual scrollable area rather than the viewport.
        root: scrollContainerNodeRef.current ?? null,
        rootMargin: "300px",
      },
    );
    observerRef.current.observe(sentinel);
  }, [loadMore]);

  // Re-create observer whenever loadMore identity changes (which happens when
  // buildQuery changes, i.e. on filter/search updates).
  useEffect(() => {
    setupObserver();
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [setupObserver]);

  /* ── Ref callbacks for sentinel and scroll container ── */
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      sentinelNodeRef.current = node;
      setupObserver();
    },
    [setupObserver],
  );

  const scrollContainerRef = useCallback(
    (node: HTMLElement | null) => {
      scrollContainerNodeRef.current = node;
      setupObserver();
    },
    [setupObserver],
  );

  // Pagination error = error that happened while items are already visible
  const paginationError = state.error !== null && state.items.length > 0;

  return {
    ...state,
    sentinelRef,
    scrollContainerRef,
    loadMore,
    paginationError,
  };
}
