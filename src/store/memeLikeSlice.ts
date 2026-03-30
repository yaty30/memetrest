import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface MemeLikeEntry {
  viewerHasLiked: boolean;
  likeCount: number;
  pending: boolean;
}

export interface MemeLikeState {
  byMemeId: Record<string, MemeLikeEntry>;
}

const initialState: MemeLikeState = {
  byMemeId: {},
};

interface MemeLikeSnapshot {
  viewerHasLiked: boolean;
  likeCount: number;
}

function normalizeLikeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeSnapshot(snapshot: MemeLikeSnapshot): MemeLikeSnapshot {
  return {
    viewerHasLiked: Boolean(snapshot.viewerHasLiked),
    likeCount: normalizeLikeCount(snapshot.likeCount),
  };
}

const memeLikeSlice = createSlice({
  name: "memeLike",
  initialState,
  reducers: {
    hydrateMemeLikeSnapshot(
      state,
      action: PayloadAction<{ memeId: string; snapshot: MemeLikeSnapshot }>,
    ) {
      const existing = state.byMemeId[action.payload.memeId];
      if (existing?.pending) {
        return;
      }

      const snapshot = normalizeSnapshot(action.payload.snapshot);
      state.byMemeId[action.payload.memeId] = {
        viewerHasLiked: snapshot.viewerHasLiked,
        likeCount: snapshot.likeCount,
        pending: false,
      };
    },
    hydrateViewerHasLiked(
      state,
      action: PayloadAction<{ memeId: string; viewerHasLiked: boolean }>,
    ) {
      const existing = state.byMemeId[action.payload.memeId];
      if (existing?.pending) {
        return;
      }

      state.byMemeId[action.payload.memeId] = {
        viewerHasLiked: action.payload.viewerHasLiked,
        likeCount: existing?.likeCount ?? 0,
        pending: false,
      };
    },
    applyMemeLikeOptimistic(
      state,
      action: PayloadAction<{ memeId: string; snapshot: MemeLikeSnapshot }>,
    ) {
      const snapshot = normalizeSnapshot(action.payload.snapshot);
      state.byMemeId[action.payload.memeId] = {
        viewerHasLiked: snapshot.viewerHasLiked,
        likeCount: snapshot.likeCount,
        pending: true,
      };
    },
    reconcileMemeLikeAuthoritative(
      state,
      action: PayloadAction<MemeLikeSnapshot & { memeId: string }>,
    ) {
      const snapshot = normalizeSnapshot(action.payload);
      state.byMemeId[action.payload.memeId] = {
        viewerHasLiked: snapshot.viewerHasLiked,
        likeCount: snapshot.likeCount,
        pending: false,
      };
    },
    rollbackMemeLikeOptimistic(
      state,
      action: PayloadAction<{ memeId: string; snapshot: MemeLikeSnapshot }>,
    ) {
      const snapshot = normalizeSnapshot(action.payload.snapshot);
      state.byMemeId[action.payload.memeId] = {
        viewerHasLiked: snapshot.viewerHasLiked,
        likeCount: snapshot.likeCount,
        pending: false,
      };
    },
  },
});

export const {
  hydrateMemeLikeSnapshot,
  hydrateViewerHasLiked,
  applyMemeLikeOptimistic,
  reconcileMemeLikeAuthoritative,
  rollbackMemeLikeOptimistic,
} = memeLikeSlice.actions;

export default memeLikeSlice.reducer;
