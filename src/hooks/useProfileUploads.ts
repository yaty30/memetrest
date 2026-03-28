import { useState, useEffect, useCallback, useRef } from "react";
import type { Meme } from "../types/meme";
import { memeService } from "../services";

const PAGE_SIZE = 20;

interface ProfileUploadsState {
  items: Meme[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

export interface UseProfileUploadsReturn extends ProfileUploadsState {
  loadMore: () => void;
}

/**
 * Fetches memes uploaded by a specific user, newest first, with cursor pagination.
 *
 * @param ownerUid    – UID of the profile owner
 * @param isOwnProfile – when true, includes all statuses (pending/approved/rejected);
 *                        otherwise only approved memes are returned.
 */
export function useProfileUploads(
  ownerUid: string | undefined,
  isOwnProfile: boolean,
): UseProfileUploadsReturn {
  const [state, setState] = useState<ProfileUploadsState>({
    items: [],
    loading: true,
    loadingMore: false,
    hasMore: false,
    error: null,
  });

  const cursorRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Reset + fetch first page when ownerUid or visibility scope changes
  useEffect(() => {
    if (!ownerUid) {
      setState({
        items: [],
        loading: false,
        loadingMore: false,
        hasMore: false,
        error: null,
      });
      return;
    }

    const gen = ++generationRef.current;
    cursorRef.current = null;
    loadingMoreRef.current = false;

    setState({
      items: [],
      loading: true,
      loadingMore: false,
      hasMore: false,
      error: null,
    });

    memeService
      .queryMemesByOwner({
        ownerUid,
        includeAllStatuses: isOwnProfile,
        limit: PAGE_SIZE,
      })
      .then((result) => {
        if (gen !== generationRef.current) return;
        setState({
          items: result.items,
          loading: false,
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
          loading: false,
          loadingMore: false,
          hasMore: false,
          error: err instanceof Error ? err.message : "Failed to load uploads",
        });
      });
  }, [ownerUid, isOwnProfile]);

  const loadMore = useCallback(() => {
    if (!ownerUid || !cursorRef.current || loadingMoreRef.current) return;

    const gen = generationRef.current;
    loadingMoreRef.current = true;

    setState((prev) => ({ ...prev, loadingMore: true, error: null }));

    memeService
      .queryMemesByOwner({
        ownerUid,
        includeAllStatuses: isOwnProfile,
        limit: PAGE_SIZE,
        cursor: cursorRef.current,
      })
      .then((result) => {
        if (gen !== generationRef.current) return;
        setState((prev) => {
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
  }, [ownerUid, isOwnProfile]);

  return { ...state, loadMore };
}
