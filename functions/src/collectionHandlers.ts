import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  CollectionError,
  collectionItemId,
  parseCreateCollectionRequest,
  parseGetMemeCollectionsRequest,
  parseSaveMemeRequest,
  parseToggleCollectionRequest,
  parseUnsaveMemeRequest,
  requireAuthenticatedUid,
  SAVED_COLLECTION_ID,
} from "./collectionLogic";

const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapError(error: unknown): never {
  if (error instanceof CollectionError) {
    throw new HttpsError(error.code, error.message);
  }
  if (error instanceof HttpsError) {
    throw error;
  }
  const msg =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  throw new HttpsError("internal", msg);
}

// ── Cloud Functions ───────────────────────────────────────────────────────────

interface SaveMemeResponse {
  memeId: string;
  saved: boolean;
  collectionIds: string[];
}

export const saveMeme = onCall<unknown, Promise<SaveMemeResponse>>(
  { invoker: "public" },
  async (request) => {
    try {
      const uid = requireAuthenticatedUid(request.auth?.uid);
      const input = parseSaveMemeRequest(request.data);

      return await db.runTransaction(async (tx) => {
        const savedColRef = db
          .collection("collections")
          .doc(`${uid}_${SAVED_COLLECTION_ID}`);
        const itemDocId = collectionItemId(SAVED_COLLECTION_ID, input.memeId);
        const itemRef = db.collection("collectionItems").doc(itemDocId);

        // ── ALL READS FIRST ──
        const [savedColSnap, itemSnap, existingItemsSnap] = await Promise.all([
          tx.get(savedColRef),
          tx.get(itemRef),
          tx.get(
            db
              .collection("collectionItems")
              .where("memeId", "==", input.memeId)
              .where("userId", "==", uid),
          ),
        ]);

        // ── THEN WRITES ──
        if (!savedColSnap.exists) {
          tx.set(savedColRef, {
            id: `${uid}_${SAVED_COLLECTION_ID}`,
            userId: uid,
            name: "Saved",
            isSystem: true,
            systemType: "saved",
            createdAt: FieldValue.serverTimestamp(),
          });
        }

        if (!itemSnap.exists) {
          tx.set(itemRef, {
            id: itemDocId,
            collectionId: SAVED_COLLECTION_ID,
            memeId: input.memeId,
            userId: uid,
            addedAt: FieldValue.serverTimestamp(),
          });
        }

        const collectionIds = existingItemsSnap.docs.map(
          (d) => d.data().collectionId as string,
        );
        if (!collectionIds.includes(SAVED_COLLECTION_ID)) {
          collectionIds.push(SAVED_COLLECTION_ID);
        }

        return {
          memeId: input.memeId,
          saved: true,
          collectionIds,
        };
      });
    } catch (error) {
      wrapError(error);
    }
  },
);

interface UnsaveMemeResponse {
  memeId: string;
  saved: boolean;
  collectionIds: string[];
}

export const unsaveMeme = onCall<unknown, Promise<UnsaveMemeResponse>>(
  { invoker: "public" },
  async (request) => {
    try {
      const uid = requireAuthenticatedUid(request.auth?.uid);
      const input = parseUnsaveMemeRequest(request.data);

      return await db.runTransaction(async (tx) => {
        // ── ALL READS FIRST ──
        const itemsSnap = await tx.get(
          db
            .collection("collectionItems")
            .where("memeId", "==", input.memeId)
            .where("userId", "==", uid),
        );

        // ── THEN WRITES ──
        for (const doc of itemsSnap.docs) {
          tx.delete(doc.ref);
        }

        return {
          memeId: input.memeId,
          saved: false,
          collectionIds: [],
        };
      });
    } catch (error) {
      wrapError(error);
    }
  },
);

interface ToggleCollectionResponse {
  memeId: string;
  saved: boolean;
  collectionIds: string[];
}

export const toggleCollection = onCall<
  unknown,
  Promise<ToggleCollectionResponse>
>({ invoker: "public" }, async (request) => {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);
    const input = parseToggleCollectionRequest(request.data);

    return await db.runTransaction(async (tx) => {
      if (input.add) {
        // ── ADD: ALL READS FIRST ──
        const targetItemId = collectionItemId(input.collectionId, input.memeId);
        const targetRef = db.collection("collectionItems").doc(targetItemId);

        const readsToPerform: Promise<unknown>[] = [tx.get(targetRef)];

        let savedColRef: FirebaseFirestore.DocumentReference | null = null;
        let savedItemRef: FirebaseFirestore.DocumentReference | null = null;

        if (input.collectionId !== SAVED_COLLECTION_ID) {
          savedColRef = db
            .collection("collections")
            .doc(`${uid}_${SAVED_COLLECTION_ID}`);
          const savedItemId = collectionItemId(
            SAVED_COLLECTION_ID,
            input.memeId,
          );
          savedItemRef = db.collection("collectionItems").doc(savedItemId);
          readsToPerform.push(tx.get(savedColRef), tx.get(savedItemRef));
        }

        const existingQuery = db
          .collection("collectionItems")
          .where("memeId", "==", input.memeId)
          .where("userId", "==", uid);
        readsToPerform.push(tx.get(existingQuery));

        const results = await Promise.all(readsToPerform);

        const targetSnap = results[0] as FirebaseFirestore.DocumentSnapshot;
        const existingSnap = results[
          results.length - 1
        ] as FirebaseFirestore.QuerySnapshot;

        let savedColSnap: FirebaseFirestore.DocumentSnapshot | null = null;
        let savedItemSnap: FirebaseFirestore.DocumentSnapshot | null = null;
        if (input.collectionId !== SAVED_COLLECTION_ID) {
          savedColSnap = results[1] as FirebaseFirestore.DocumentSnapshot;
          savedItemSnap = results[2] as FirebaseFirestore.DocumentSnapshot;
        }

        // ── THEN WRITES ──
        if (!targetSnap.exists) {
          tx.set(targetRef, {
            id: targetItemId,
            collectionId: input.collectionId,
            memeId: input.memeId,
            userId: uid,
            addedAt: FieldValue.serverTimestamp(),
          });
        }

        if (input.collectionId !== SAVED_COLLECTION_ID) {
          if (savedColRef && savedColSnap && !savedColSnap.exists) {
            tx.set(savedColRef, {
              id: `${uid}_${SAVED_COLLECTION_ID}`,
              userId: uid,
              name: "Saved",
              isSystem: true,
              systemType: "saved",
              createdAt: FieldValue.serverTimestamp(),
            });
          }
          if (savedItemRef && savedItemSnap && !savedItemSnap.exists) {
            const savedItemId = collectionItemId(
              SAVED_COLLECTION_ID,
              input.memeId,
            );
            tx.set(savedItemRef, {
              id: savedItemId,
              collectionId: SAVED_COLLECTION_ID,
              memeId: input.memeId,
              userId: uid,
              addedAt: FieldValue.serverTimestamp(),
            });
          }
        }

        const collectionIds = existingSnap.docs.map(
          (d) => d.data().collectionId as string,
        );
        if (!collectionIds.includes(input.collectionId)) {
          collectionIds.push(input.collectionId);
        }
        if (!collectionIds.includes(SAVED_COLLECTION_ID)) {
          collectionIds.push(SAVED_COLLECTION_ID);
        }

        return {
          memeId: input.memeId,
          saved: true,
          collectionIds,
        };
      } else {
        // ── REMOVE ──
        if (input.collectionId === SAVED_COLLECTION_ID) {
          // Invariant 2: removing from Saved → remove from ALL
          const itemsSnap = await tx.get(
            db
              .collection("collectionItems")
              .where("memeId", "==", input.memeId)
              .where("userId", "==", uid),
          );
          for (const doc of itemsSnap.docs) {
            tx.delete(doc.ref);
          }
          return {
            memeId: input.memeId,
            saved: false,
            collectionIds: [],
          };
        } else {
          const targetItemId = collectionItemId(
            input.collectionId,
            input.memeId,
          );
          const targetRef = db.collection("collectionItems").doc(targetItemId);

          const [targetSnap, existingSnap] = await Promise.all([
            tx.get(targetRef),
            tx.get(
              db
                .collection("collectionItems")
                .where("memeId", "==", input.memeId)
                .where("userId", "==", uid),
            ),
          ]);

          if (targetSnap.exists) {
            tx.delete(targetRef);
          }

          const collectionIds = existingSnap.docs
            .map((d) => d.data().collectionId as string)
            .filter((id) => id !== input.collectionId);
          const saved = collectionIds.includes(SAVED_COLLECTION_ID);

          return {
            memeId: input.memeId,
            saved,
            collectionIds,
          };
        }
      }
    });
  } catch (error) {
    wrapError(error);
  }
});

interface CreateCollectionResponse {
  collection: {
    id: string;
    userId: string;
    name: string;
    isSystem: boolean;
    createdAt: number;
  };
  memeId?: string;
  saved?: boolean;
  collectionIds?: string[];
}

export const createCollection = onCall<
  unknown,
  Promise<CreateCollectionResponse>
>({ invoker: "public" }, async (request) => {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);
    const input = parseCreateCollectionRequest(request.data);

    return await db.runTransaction(async (tx) => {
      const colRef = db.collection("collections").doc();
      const now = Date.now();
      const colData = {
        id: colRef.id,
        userId: uid,
        name: input.name,
        isSystem: false,
        createdAt: now,
      };

      if (input.memeId) {
        const savedColRef = db
          .collection("collections")
          .doc(`${uid}_${SAVED_COLLECTION_ID}`);
        const newItemId = collectionItemId(colRef.id, input.memeId);
        const newItemRef = db.collection("collectionItems").doc(newItemId);
        const savedItemId = collectionItemId(SAVED_COLLECTION_ID, input.memeId);
        const savedItemRef = db.collection("collectionItems").doc(savedItemId);

        // ── ALL READS FIRST ──
        const [savedColSnap, newItemSnap, savedItemSnap, existingSnap] =
          await Promise.all([
            tx.get(savedColRef),
            tx.get(newItemRef),
            tx.get(savedItemRef),
            tx.get(
              db
                .collection("collectionItems")
                .where("memeId", "==", input.memeId)
                .where("userId", "==", uid),
            ),
          ]);

        // ── THEN WRITES ──
        tx.set(colRef, colData);

        if (!savedColSnap.exists) {
          tx.set(savedColRef, {
            id: `${uid}_${SAVED_COLLECTION_ID}`,
            userId: uid,
            name: "Saved",
            isSystem: true,
            systemType: "saved",
            createdAt: FieldValue.serverTimestamp(),
          });
        }

        if (!newItemSnap.exists) {
          tx.set(newItemRef, {
            id: newItemId,
            collectionId: colRef.id,
            memeId: input.memeId,
            userId: uid,
            addedAt: FieldValue.serverTimestamp(),
          });
        }

        if (!savedItemSnap.exists) {
          tx.set(savedItemRef, {
            id: savedItemId,
            collectionId: SAVED_COLLECTION_ID,
            memeId: input.memeId,
            userId: uid,
            addedAt: FieldValue.serverTimestamp(),
          });
        }

        const collectionIds = existingSnap.docs.map(
          (d) => d.data().collectionId as string,
        );
        if (!collectionIds.includes(colRef.id)) {
          collectionIds.push(colRef.id);
        }
        if (!collectionIds.includes(SAVED_COLLECTION_ID)) {
          collectionIds.push(SAVED_COLLECTION_ID);
        }

        return {
          collection: colData,
          memeId: input.memeId,
          saved: true,
          collectionIds,
        };
      } else {
        // No memeId — just create the collection doc
        tx.set(colRef, colData);

        return {
          collection: colData,
          memeId: undefined,
          saved: undefined,
          collectionIds: undefined,
        };
      }
    });
  } catch (error) {
    wrapError(error);
  }
});

interface GetMemeCollectionsResponse {
  memeId: string;
  collectionIds: string[];
  saved: boolean;
}

export const getMemeCollections = onCall<
  unknown,
  Promise<GetMemeCollectionsResponse>
>({ invoker: "public" }, async (request) => {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);
    const input = parseGetMemeCollectionsRequest(request.data);

    const snap = await db
      .collection("collectionItems")
      .where("memeId", "==", input.memeId)
      .where("userId", "==", uid)
      .get();

    const collectionIds = snap.docs.map((d) => d.data().collectionId as string);
    const saved = collectionIds.includes(SAVED_COLLECTION_ID);

    return {
      memeId: input.memeId,
      collectionIds,
      saved,
    };
  } catch (error) {
    wrapError(error);
  }
});

interface GetUserCollectionsResponse {
  collections: Array<{
    id: string;
    userId: string;
    name: string;
    isSystem: boolean;
    systemType?: string;
    createdAt: number;
  }>;
}

export const getUserCollections = onCall<
  unknown,
  Promise<GetUserCollectionsResponse>
>({ invoker: "public" }, async (request) => {
  try {
    const uid = requireAuthenticatedUid(request.auth?.uid);

    const snap = await db
      .collection("collections")
      .where("userId", "==", uid)
      .get();

    const collections = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.id as string,
        userId: data.userId as string,
        name: data.name as string,
        isSystem: data.isSystem as boolean,
        systemType: data.systemType as string | undefined,
        createdAt: data.createdAt?.toMillis?.() ?? (data.createdAt as number),
      };
    });

    return { collections };
  } catch (error) {
    wrapError(error);
  }
});
