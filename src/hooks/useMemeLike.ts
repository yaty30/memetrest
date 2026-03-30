import { useCallback, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import {
  getViewerHasLiked,
  setMemeLike,
} from "../services/firebaseLikeService";
import {
  runOptimisticMemeLikeMutation,
  type MemeLikeSnapshot,
} from "../services/memeLikeMutation";
import { store } from "../store";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  applyMemeLikeOptimistic,
  hydrateMemeLikeSnapshot,
  hydrateViewerHasLiked,
  reconcileMemeLikeAuthoritative,
  rollbackMemeLikeOptimistic,
} from "../store/memeLikeSlice";

interface UseMemeLikeParams {
  memeId: string | null;
  initialLikeCount: number;
  initialViewerHasLiked?: boolean;
  onAuthRequired?: () => void;
}

function normalizeLikeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function useMemeLike({
  memeId,
  initialLikeCount,
  initialViewerHasLiked = false,
  onAuthRequired,
}: UseMemeLikeParams) {
  const { firebaseUser } = useAuth();
  const dispatch = useAppDispatch();

  const entry = useAppSelector((state) =>
    memeId ? state.memeLike.byMemeId[memeId] : undefined,
  );

  useEffect(() => {
    if (!memeId) return;
    dispatch(
      hydrateMemeLikeSnapshot({
        memeId,
        snapshot: {
          viewerHasLiked: Boolean(initialViewerHasLiked),
          likeCount: normalizeLikeCount(initialLikeCount),
        },
      }),
    );
  }, [dispatch, memeId, initialViewerHasLiked, initialLikeCount]);

  useEffect(() => {
    if (!memeId) return;
    let cancelled = false;

    if (!firebaseUser) {
      dispatch(hydrateViewerHasLiked({ memeId, viewerHasLiked: false }));
      return () => {
        cancelled = true;
      };
    }

    getViewerHasLiked(firebaseUser.uid, memeId)
      .then((viewerHasLiked) => {
        if (cancelled) return;
        dispatch(hydrateViewerHasLiked({ memeId, viewerHasLiked }));
      })
      .catch(() => {
        // Keep current viewer-like state when lookup fails.
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, firebaseUser, memeId]);

  const handleLike = useCallback(() => {
    if (!memeId) return;

    if (!firebaseUser) {
      onAuthRequired?.();
      return;
    }

    const state = store.getState();
    const current = state.memeLike.byMemeId[memeId];
    const previous: MemeLikeSnapshot = {
      viewerHasLiked: current?.viewerHasLiked ?? Boolean(initialViewerHasLiked),
      likeCount: current?.likeCount ?? normalizeLikeCount(initialLikeCount),
    };

    void runOptimisticMemeLikeMutation({
      memeId,
      previous,
      inFlight: Boolean(current?.pending),
      applyOptimistic: (snapshot) => {
        dispatch(applyMemeLikeOptimistic({ memeId, snapshot }));
      },
      request: setMemeLike,
      reconcileAuthoritative: (result) => {
        dispatch(reconcileMemeLikeAuthoritative(result));
      },
      rollback: (snapshot) => {
        dispatch(rollbackMemeLikeOptimistic({ memeId, snapshot }));
      },
    });
  }, [
    dispatch,
    firebaseUser,
    memeId,
    initialViewerHasLiked,
    initialLikeCount,
    onAuthRequired,
  ]);

  return {
    viewerHasLiked: entry?.viewerHasLiked ?? Boolean(initialViewerHasLiked),
    likeCount: entry?.likeCount ?? normalizeLikeCount(initialLikeCount),
    likePending: Boolean(entry?.pending),
    handleLike,
  };
}
