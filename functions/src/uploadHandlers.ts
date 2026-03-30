import { initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  createAssetEvent,
  createDefaultUserUploadProfile,
  createInitialAssetDoc,
} from "../../src/services/uploadDefaults";
import {
  hasExceededUploadLimits,
  isReviewableAssetStatus,
  isUploadSuspended,
} from "../../src/services/uploadGuards";
import {
  getQuarantineOriginalPath,
  getQuarantinePreviewPath,
  getQuarantineThumbnailPath,
} from "../../src/utils/uploadStoragePaths";
import type { UploadAssetDoc, UserUploadProfile } from "../../src/types/upload";

initializeApp();

const db = getFirestore();

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

interface InitializeUploadRequest {
  mimeType: string;
  fileSize: number;
}

interface InitializeUploadResponse {
  assetId: string;
  ownerId: string;
  uploadIssuedAt: number;
  quarantinePaths: {
    originalPath: string;
    previewPath: string;
    thumbnailPath: string;
  };
}

interface FinalizeUploadAssetRequest {
  assetId: string;
  title: string;
  description?: string | null;
  tags?: string[];
  mimeType: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
    aspectRatio?: number;
  };
  fileHash?: string | null;
}

interface FinalizeUploadAssetResponse {
  assetId: string;
  status: UploadAssetDoc["status"];
  visibility: UploadAssetDoc["visibility"];
  createdAt: number;
}

interface SubmitAssetForReviewRequest {
  assetId: string;
  note?: string | null;
}

interface SubmitAssetForReviewResponse {
  assetId: string;
  status: UploadAssetDoc["status"];
  submitted: boolean;
}

interface UserDocLike {
  uploadProfile?: UserUploadProfile;
}

function requireAuthUid(uid?: string): string {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  return uid;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be a non-empty string.`,
    );
  }
  return value.trim();
}

function requirePositiveNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be a positive number.`,
    );
  }
  return value;
}

function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, 30);
}

function floorToWindow(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

function normalizeProfileForNow(
  profile: UserUploadProfile,
  now: number,
): UserUploadProfile {
  const usage = profile.usage;

  const dailyWindowStart = floorToWindow(now, DAY_MS);
  const weeklyWindowStart = floorToWindow(now, WEEK_MS);
  const monthlyWindowStart = floorToWindow(now, MONTH_MS);
  const hourlyWindowStart = floorToWindow(now, HOUR_MS);

  return {
    ...profile,
    usage: {
      ...usage,
      dailyCount:
        usage.dailyWindowStart === dailyWindowStart ? usage.dailyCount : 0,
      weeklyCount:
        usage.weeklyWindowStart === weeklyWindowStart ? usage.weeklyCount : 0,
      monthlyCount:
        usage.monthlyWindowStart === monthlyWindowStart
          ? usage.monthlyCount
          : 0,
      hourlyCount:
        usage.hourlyWindowStart === hourlyWindowStart ? usage.hourlyCount : 0,
      dailyWindowStart,
      weeklyWindowStart,
      monthlyWindowStart,
      hourlyWindowStart,
    },
  };
}

function readUploadProfile(
  userData: UserDocLike | undefined,
  now: number,
): UserUploadProfile {
  const fallback = createDefaultUserUploadProfile("basic", now);
  if (!userData?.uploadProfile) return fallback;
  return normalizeProfileForNow(userData.uploadProfile, now);
}

function enforceUploadAllowed(profile: UserUploadProfile, now: number): void {
  if (isUploadSuspended(profile, now)) {
    throw new HttpsError(
      "permission-denied",
      "Uploads are suspended for this account.",
    );
  }

  if (hasExceededUploadLimits(profile, now, 1)) {
    throw new HttpsError("resource-exhausted", "Upload limits exceeded.");
  }
}

function applyUploadUsageIncrement(
  profile: UserUploadProfile,
  now: number,
): UserUploadProfile {
  const normalized = normalizeProfileForNow(profile, now);
  return {
    ...normalized,
    usage: {
      ...normalized.usage,
      dailyCount: normalized.usage.dailyCount + 1,
      weeklyCount: normalized.usage.weeklyCount + 1,
      monthlyCount: normalized.usage.monthlyCount + 1,
      hourlyCount: normalized.usage.hourlyCount + 1,
      lastUploadAt: now,
    },
  };
}

function userRefByUid(firestore: Firestore, uid: string): DocumentReference {
  return firestore.collection("users").doc(uid);
}

export const initializeUpload = onCall<
  InitializeUploadRequest,
  Promise<InitializeUploadResponse>
>({ invoker: "public" }, async (request) => {
  const uid = requireAuthUid(request.auth?.uid);
  const now = Date.now();

  requireNonEmptyString(request.data?.mimeType, "mimeType");
  requirePositiveNumber(request.data?.fileSize, "fileSize");

  const userRef = userRefByUid(db, uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError("failed-precondition", "User profile not found.");
  }

  const profile = readUploadProfile(userSnap.data() as UserDocLike, now);
  enforceUploadAllowed(profile, now);

  const assetId = db.collection("assets").doc().id;

  return {
    assetId,
    ownerId: uid,
    uploadIssuedAt: now,
    quarantinePaths: {
      originalPath: getQuarantineOriginalPath(assetId),
      previewPath: getQuarantinePreviewPath(assetId),
      thumbnailPath: getQuarantineThumbnailPath(assetId),
    },
  };
});

export const finalizeUploadAsset = onCall<
  FinalizeUploadAssetRequest,
  Promise<FinalizeUploadAssetResponse>
>({ invoker: "public" }, async (request) => {
  const uid = requireAuthUid(request.auth?.uid);
  const now = Date.now();

  const assetId = requireNonEmptyString(request.data?.assetId, "assetId");
  const title = requireNonEmptyString(request.data?.title, "title");
  const mimeType = requireNonEmptyString(request.data?.mimeType, "mimeType");
  const fileSize = requirePositiveNumber(request.data?.fileSize, "fileSize");

  const width = requirePositiveNumber(
    request.data?.dimensions?.width,
    "dimensions.width",
  );
  const height = requirePositiveNumber(
    request.data?.dimensions?.height,
    "dimensions.height",
  );

  const description =
    typeof request.data?.description === "string"
      ? request.data.description.trim() || null
      : null;

  const tags = sanitizeTags(request.data?.tags);

  // Resolve a persistent download URL for the quarantine original so the
  // creator can preview their own upload. The token-based URL bypasses
  // Storage security rules without weakening them.
  const originalPath = getQuarantineOriginalPath(assetId);
  let originalUrl: string | null = null;
  try {
    const bucket = getStorage().bucket();
    const file = bucket.file(originalPath);
    const [metadata] = await file.getMetadata();
    let token =
      (metadata.metadata as Record<string, string> | undefined)
        ?.firebaseStorageDownloadTokens ?? null;

    // Client SDK uploads don't auto-generate a download token.
    // Create one so the owner can preview quarantined assets.
    if (!token) {
      const { randomUUID } = await import("crypto");
      token = randomUUID();
      await file.setMetadata({
        metadata: { firebaseStorageDownloadTokens: token },
      });
    }

    originalUrl = [
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`,
      `${encodeURIComponent(originalPath)}?alt=media&token=${token}`,
    ].join("");
  } catch {
    // File metadata unavailable — proceed without a preview URL.
  }

  const userRef = userRefByUid(db, uid);
  const assetRef = db.collection("assets").doc(assetId);
  const eventRef = assetRef.collection("events").doc();

  await db.runTransaction(async (tx) => {
    const [userSnap, assetSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(assetRef),
    ]);

    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "User profile not found.");
    }

    if (assetSnap.exists) {
      throw new HttpsError("already-exists", "Asset already exists.");
    }

    const profile = readUploadProfile(userSnap.data() as UserDocLike, now);
    enforceUploadAllowed(profile, now);

    const updatedProfile = applyUploadUsageIncrement(profile, now);

    const asset = createInitialAssetDoc({
      id: assetId,
      ownerId: uid,
      kind: mimeType.toLowerCase() === "image/gif" ? "gif" : "image",
      title,
      description,
      tags,
      mimeType,
      fileSize,
      isAnimated: mimeType.toLowerCase() === "image/gif",
      dimensions: {
        width,
        height,
        aspectRatio: request.data?.dimensions?.aspectRatio,
      },
      storage: {
        originalPath: getQuarantineOriginalPath(assetId),
        previewPath: getQuarantinePreviewPath(assetId),
        thumbnailPath: getQuarantineThumbnailPath(assetId),
      },
      urls: { originalUrl },
      fileHash:
        typeof request.data?.fileHash === "string"
          ? request.data.fileHash.trim() || null
          : null,
      now,
    });

    const uploadEvent = createAssetEvent({
      id: eventRef.id,
      assetId,
      actorId: uid,
      type: "upload_completed",
      metadata: {
        reasonCode: null,
        fromStatus: null,
        toStatus: "uploaded",
      },
      now,
    });

    tx.set(assetRef, {
      ...asset,
      createdAt: Timestamp.fromMillis(asset.createdAt),
      updatedAt: Timestamp.fromMillis(asset.updatedAt),
      publishedAt: null,
      removedAt: null,
      processing: {
        ...asset.processing,
        uploadCompletedAt: asset.processing.uploadCompletedAt
          ? Timestamp.fromMillis(asset.processing.uploadCompletedAt)
          : null,
        metadataExtractedAt: null,
        derivativesGeneratedAt: null,
      },
      moderation: {
        ...asset.moderation,
        reviewedAt: null,
      },
      source: {
        sourceType: "upload",
        sourceUrl: null,
        attributionText: null,
      },
    });

    tx.set(eventRef, {
      ...uploadEvent,
      createdAt: Timestamp.fromMillis(uploadEvent.createdAt),
    });

    tx.set(
      userRef,
      {
        uploadProfile: updatedProfile,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return {
    assetId,
    status: "uploaded",
    visibility: "private",
    createdAt: now,
  };
});

export const submitAssetForReview = onCall<
  SubmitAssetForReviewRequest,
  Promise<SubmitAssetForReviewResponse>
>({ invoker: "public" }, async (request) => {
  const uid = requireAuthUid(request.auth?.uid);
  const now = Date.now();
  const assetId = requireNonEmptyString(request.data?.assetId, "assetId");

  const note =
    typeof request.data?.note === "string"
      ? request.data.note.trim() || null
      : null;

  const assetRef = db.collection("assets").doc(assetId);
  const eventRef = assetRef.collection("events").doc();

  let submitted = false;
  let resultingStatus: UploadAssetDoc["status"] = "uploaded";

  await db.runTransaction(async (tx) => {
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists) {
      throw new HttpsError("not-found", "Asset not found.");
    }

    const asset = assetSnap.data() as Partial<UploadAssetDoc>;
    if (asset.ownerId !== uid) {
      throw new HttpsError(
        "permission-denied",
        "Only asset owner can submit for review.",
      );
    }

    const currentStatus = asset.status;
    if (!currentStatus) {
      throw new HttpsError("failed-precondition", "Asset has invalid status.");
    }

    if (!isReviewableAssetStatus(currentStatus)) {
      throw new HttpsError("failed-precondition", "Asset is not reviewable.");
    }

    if (currentStatus === "pending_review") {
      resultingStatus = "pending_review";
      submitted = false;
      return;
    }

    const reviewEvent = createAssetEvent({
      id: eventRef.id,
      assetId,
      actorId: uid,
      type: "submitted_for_review",
      note,
      metadata: {
        reasonCode: null,
        fromStatus: currentStatus,
        toStatus: "pending_review",
      },
      now,
    });

    tx.set(
      assetRef,
      {
        status: "pending_review",
        updatedAt: Timestamp.fromMillis(now),
      },
      { merge: true },
    );

    tx.set(eventRef, {
      ...reviewEvent,
      createdAt: Timestamp.fromMillis(reviewEvent.createdAt),
    });

    resultingStatus = "pending_review";
    submitted = true;
  });

  return {
    assetId,
    status: resultingStatus,
    submitted,
  };
});
