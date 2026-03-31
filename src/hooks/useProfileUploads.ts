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

type InternalProfileUploadsState = Omit<ProfileUploadsState, "loading"> & {
  key: string | null;
};

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
  const queryKey = ownerUid ? `${ownerUid}:${isOwnProfile ? "owner" : "public"}` : null;
  const [state, setState] = useState<InternalProfileUploadsState>({
    key: null,
    items: [],
    loadingMore: false,
    hasMore: false,
    error: null,
  });

  const cursorRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // Reset + fetch first page when ownerUid or visibility scope changes
  useEffect(() => {
    if (!ownerUid || !queryKey) {
      cursorRef.current = null;
      loadingMoreRef.current = false;
      return;
    }

    const gen = ++generationRef.current;
    cursorRef.current = null;
    loadingMoreRef.current = false;

    memeService
      .queryMemesByOwner({
        ownerUid,
        includeAllStatuses: isOwnProfile,
        limit: PAGE_SIZE,
      })
      .then((result) => {
        if (gen !== generationRef.current) return;
        setState({
          key: queryKey,
          items: result.items,
          loadingMore: false,
          hasMore: result.hasMore,
          error: null,
        });
        cursorRef.current = result.nextCursor;
      })
      .catch((err) => {
        if (gen !== generationRef.current) return;
        setState({
          key: queryKey,
          items: [],
          loadingMore: false,
          hasMore: false,
          error: err instanceof Error ? err.message : "Failed to load uploads",
        });
      });
  }, [ownerUid, isOwnProfile, queryKey]);

  const loadMore = useCallback(() => {
    if (!ownerUid || !queryKey || !cursorRef.current || loadingMoreRef.current) {
      return;
    }

    const gen = generationRef.current;
    loadingMoreRef.current = true;

    setState((prev) =>
      prev.key !== queryKey ? prev : { ...prev, loadingMore: true, error: null },
    );

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
          if (prev.key !== queryKey) return prev;
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
        setState((prev) =>
          prev.key !== queryKey
            ? prev
            : {
                ...prev,
                loadingMore: false,
                error: err instanceof Error ? err.message : "Failed to load more",
              },
        );
      })
      .finally(() => {
        loadingMoreRef.current = false;
      });
  }, [ownerUid, isOwnProfile, queryKey]);

  if (!queryKey) {
    return {
      items: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      loadMore,
    };
  }

  const keyMatches = state.key === queryKey;

  return {
    items: keyMatches ? state.items : [],
    loading: !keyMatches,
    loadingMore: keyMatches ? state.loadingMore : false,
    hasMore: keyMatches ? state.hasMore : false,
    error: keyMatches ? state.error : null,
    loadMore,
  };
}
