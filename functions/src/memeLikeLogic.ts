export interface SetMemeLikeRequest {
  memeId: string;
  liked: boolean;
}

export interface LikeMutationInput {
  memeExists: boolean;
  likeExists: boolean;
  currentLikeCount: unknown;
  liked: boolean;
}

export interface LikeMutationPlan {
  createLikeDoc: boolean;
  deleteLikeDoc: boolean;
  nextLikeCount: number;
  viewerHasLiked: boolean;
}

export type MemeLikeErrorCode =
  | "invalid-argument"
  | "unauthenticated"
  | "not-found";

export class MemeLikeError extends Error {
  readonly code: MemeLikeErrorCode;

  constructor(code: MemeLikeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function requireAuthenticatedUid(uid: unknown): string {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new MemeLikeError("unauthenticated", "Authentication is required.");
  }
  return uid;
}

export function parseSetMemeLikeRequest(data: unknown): SetMemeLikeRequest {
  const payload =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : null;

  const rawMemeId = payload?.memeId;
  const liked = payload?.liked;

  if (typeof rawMemeId !== "string") {
    throw new MemeLikeError("invalid-argument", "memeId must be a string.");
  }

  const memeId = rawMemeId.trim();
  if (!memeId || memeId.length > 256 || memeId.includes("/")) {
    throw new MemeLikeError(
      "invalid-argument",
      "memeId must be a non-empty Firestore document ID.",
    );
  }

  if (typeof liked !== "boolean") {
    throw new MemeLikeError("invalid-argument", "liked must be a boolean.");
  }

  return { memeId, liked };
}

export function normalizeLikeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

export function buildLikeMutationPlan(input: LikeMutationInput): LikeMutationPlan {
  if (!input.memeExists) {
    throw new MemeLikeError("not-found", "Meme not found.");
  }

  const currentLikeCount = normalizeLikeCount(input.currentLikeCount);

  if (input.liked) {
    if (input.likeExists) {
      return {
        createLikeDoc: false,
        deleteLikeDoc: false,
        nextLikeCount: currentLikeCount,
        viewerHasLiked: true,
      };
    }

    return {
      createLikeDoc: true,
      deleteLikeDoc: false,
      nextLikeCount: currentLikeCount + 1,
      viewerHasLiked: true,
    };
  }

  if (!input.likeExists) {
    return {
      createLikeDoc: false,
      deleteLikeDoc: false,
      nextLikeCount: currentLikeCount,
      viewerHasLiked: false,
    };
  }

  return {
    createLikeDoc: false,
    deleteLikeDoc: true,
    nextLikeCount: Math.max(0, currentLikeCount - 1),
    viewerHasLiked: false,
  };
}
