import type { SetMemeLikeResponse } from "./firebaseLikeService";

export interface MemeLikeSnapshot {
  viewerHasLiked: boolean;
  likeCount: number;
}

export function buildOptimisticMemeLikeSnapshot(
  previous: MemeLikeSnapshot,
): MemeLikeSnapshot {
  const nextLiked = !previous.viewerHasLiked;
  const nextLikeCount = Math.max(0, previous.likeCount + (nextLiked ? 1 : -1));
  return {
    viewerHasLiked: nextLiked,
    likeCount: nextLikeCount,
  };
}

interface RunOptimisticMemeLikeParams {
  memeId: string;
  previous: MemeLikeSnapshot;
  inFlight: boolean;
  applyOptimistic: (snapshot: MemeLikeSnapshot) => void;
  reconcileAuthoritative: (result: SetMemeLikeResponse) => void;
  rollback: (previous: MemeLikeSnapshot) => void;
  request: (memeId: string, liked: boolean) => Promise<SetMemeLikeResponse>;
}

export async function runOptimisticMemeLikeMutation(
  params: RunOptimisticMemeLikeParams,
): Promise<boolean> {
  if (params.inFlight) {
    return false;
  }

  const next = buildOptimisticMemeLikeSnapshot(params.previous);
  params.applyOptimistic(next);

  try {
    const result = await params.request(params.memeId, next.viewerHasLiked);
    params.reconcileAuthoritative(result);
  } catch {
    params.rollback(params.previous);
  }

  return true;
}
