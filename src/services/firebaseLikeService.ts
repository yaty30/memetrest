import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functionsClient } from "../../firebase";

export interface SetMemeLikeRequest {
  memeId: string;
  liked: boolean;
}

export interface SetMemeLikeResponse {
  memeId: string;
  viewerHasLiked: boolean;
  likeCount: number;
}

function toCallableError(operation: string, error: unknown): Error {
  if (error instanceof FirebaseError) {
    return new Error(`${operation} failed (${error.code}): ${error.message}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(`${operation} failed.`);
}

export async function setMemeLike(
  memeId: string,
  liked: boolean,
): Promise<SetMemeLikeResponse> {
  const trimmedMemeId = memeId.trim();
  if (!trimmedMemeId) {
    throw new Error("memeId is required.");
  }

  try {
    const callable = httpsCallable<SetMemeLikeRequest, SetMemeLikeResponse>(
      functionsClient,
      "setMemeLike",
    );
    const result = await callable({ memeId: trimmedMemeId, liked });
    return result.data;
  } catch (error) {
    throw toCallableError("setMemeLike", error);
  }
}

function likeDocId(userId: string, memeId: string): string {
  return `${userId}_${memeId}`;
}

export async function getViewerHasLiked(
  userId: string,
  memeId: string,
): Promise<boolean> {
  const snapshot = await getDoc(doc(db, "memeLikes", likeDocId(userId, memeId)));
  return snapshot.exists();
}
