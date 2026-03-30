import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  buildLikeMutationPlan,
  MemeLikeError,
  normalizeLikeCount,
  parseSetMemeLikeRequest,
  requireAuthenticatedUid,
  type SetMemeLikeRequest,
} from "./memeLikeLogic";

const db = getFirestore();

interface SetMemeLikeResponse {
  memeId: string;
  viewerHasLiked: boolean;
  likeCount: number;
}

export const setMemeLike = onCall<
  SetMemeLikeRequest,
  Promise<SetMemeLikeResponse>
>({ invoker: "public" }, async (request) => {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);
    const input = parseSetMemeLikeRequest(request.data);

    const memeRef = db.collection("memes").doc(input.memeId);
    const likeDocId = `${uid}_${input.memeId}`;
    const likeRef = db.collection("memeLikes").doc(likeDocId);

    return await db.runTransaction(async (tx) => {
      const [memeSnap, likeSnap] = await Promise.all([tx.get(memeRef), tx.get(likeRef)]);

      const currentLikeCount = memeSnap.exists
        ? normalizeLikeCount(memeSnap.data()?.likeCount)
        : 0;
      const plan = buildLikeMutationPlan({
        memeExists: memeSnap.exists,
        likeExists: likeSnap.exists,
        currentLikeCount,
        liked: input.liked,
      });

      if (plan.createLikeDoc) {
        tx.set(likeRef, {
          userId: uid,
          memeId: input.memeId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      if (plan.deleteLikeDoc) {
        tx.delete(likeRef);
      }

      const rawLikeCount = memeSnap.data()?.likeCount;
      const hasNormalizedCount =
        typeof rawLikeCount === "number" &&
        Number.isFinite(rawLikeCount) &&
        rawLikeCount >= 0 &&
        rawLikeCount === Math.floor(rawLikeCount);
      const shouldWriteLikeCount =
        !hasNormalizedCount || plan.nextLikeCount !== rawLikeCount;

      if (shouldWriteLikeCount) {
        tx.update(memeRef, { likeCount: plan.nextLikeCount });
      }

      return {
        memeId: input.memeId,
        viewerHasLiked: plan.viewerHasLiked,
        likeCount: plan.nextLikeCount,
      };
    });
  } catch (error) {
    if (error instanceof MemeLikeError) {
      throw new HttpsError(error.code, error.message);
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Failed to set meme like state.");
  }
});
