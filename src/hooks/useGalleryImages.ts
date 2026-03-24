import { useState, useEffect, useCallback, useRef } from "react";
import type { Meme, MemeQuery } from "../types/meme";
import type { DiscoveryFilters } from "../types/discovery";
import { memeService } from "../services";

export function useGalleryImages(searchQuery = "", filters?: DiscoveryFilters) {
  const [items, setItems] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);

  // Build query from search + filters
  const buildQuery = useCallback(
    (cursor?: string): MemeQuery => ({
      searchText: searchQuery || undefined,
      tags: filters?.activeTags.length ? filters.activeTags : undefined,
      category: filters?.activeCategory ?? undefined,
      sortBy: filters?.sortBy ?? "newest",
      excludeNsfw: filters?.excludeNsfw ?? true,
      cursor,
    }),
    [searchQuery, filters],
  );

  // Reset state when query changes (state-during-render pattern, avoids
  // synchronous setState inside useEffect).
  const [prevQuery, setPrevQuery] = useState(() => buildQuery);
  if (prevQuery !== buildQuery) {
    setPrevQuery(() => buildQuery);
    setLoading(true);
    setError(null);
  }

  // Initial + filter-change load
  useEffect(() => {
    let cancelled = false;
    cursorRef.current = null;

    memeService
      .queryMemes(buildQuery())
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setHasMore(result.hasMore);
          cursorRef.current = result.nextCursor;
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load images",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildQuery]);

  // Load next page
  const loadMore = useCallback(() => {
    if (!cursorRef.current || !hasMore) return;
    memeService
      .queryMemes(buildQuery(cursorRef.current))
      .then((result) => {
        setItems((prev) => [...prev, ...result.items]);
        setHasMore(result.hasMore);
        cursorRef.current = result.nextCursor;
      })
      .catch(() => {
        // silently fail — user can retry
      });
  }, [buildQuery, hasMore]);

  return { items, loading, error, hasMore, loadMore };
}
