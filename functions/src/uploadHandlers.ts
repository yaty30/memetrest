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
import { buildSearchKeywordsFromTags } from "../../src/utils/searchKeywords";
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
  source?: string | null;
  visibility?: UploadAssetDoc["visibility"];
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

interface ApproveUploadAssetRequest {
  assetId: string;
}

interface ApproveUploadAssetResponse {
  assetId: string;
  status: UploadAssetDoc["status"];
  approved: boolean;
}

interface UserDocLike {
  uploadProfile?: UserUploadProfile;
}

interface MemeOverlayDoc {
  avatar: string;
  name: string;
}

interface MemeBridgeDoc {
  id: string;
  title: string;
  description: string;
  tags: string[];
  searchKeywords: string[];
  category: string;
  templateName: string;
  language: string;
  imageUrl: string;
  storagePath: string;
  mimeType: string;
  animated: boolean;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  aspectRatio: number;
  nsfw: boolean;
  sensitive: boolean;
  status: "approved";
  uploadedBy: string | null;
  overlay: MemeOverlayDoc | null;
  moderatedBy: string | null;
  moderatedAt: Timestamp;
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  createdAt?: Timestamp;
  uploadedAt?: Timestamp;
  likeCount?: number;
  shareCount?: number;
  downloadCount?: number;
  popularityScore?: number;
}

function requireAuthUid(uid?: string): string {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  return uid;
}

function requireAdminAuth(token: unknown): void {
  const authToken =
    typeof token === "object" && token !== null
      ? (token as Record<string, unknown>)
      : null;
  if (authToken?.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Admin role is required for approval.",
    );
  }
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

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  const normalized = tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, 30);

  return Array.from(new Set(normalized));
}

function normalizeVisibility(value: unknown): UploadAssetDoc["visibility"] {
  if (value == null) return "private";
  if (value === "private" || value === "public") return value;
  throw new HttpsError(
    "invalid-argument",
    "visibility must be either 'private' or 'public'.",
  );
}

function normalizeSourceInput(value: unknown): {
  sourceUrl: string | null;
  attributionText: string | null;
} {
  if (typeof value !== "string") {
    return { sourceUrl: null, attributionText: null };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { sourceUrl: null, attributionText: null };
  }

  let sourceUrl: string | null = null;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      sourceUrl = parsed.toString();
    }
  } catch {
    // Keep source as attribution text when it's not a URL.
  }

  return {
    sourceUrl,
    attributionText: normalized,
  };
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
  const normalized = normalizeProfileForNow(userData.uploadProfile, now);
  // Always derive limits from code so deploys take effect immediately
  const canonical = createDefaultUserUploadProfile(normalized.trustTier, now);
  return { ...normalized, limits: canonical.limits };
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function asMillis(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value instanceof Timestamp) return value.toMillis();
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return fallback;
}

function mapApprovedAssetToMemeDoc(input: {
  assetId: string;
  assetData: Record<string, unknown>;
  ownerData: Record<string, unknown> | null;
  existingMemeData: Record<string, unknown> | null;
  approverId: string;
  now: number;
}): MemeBridgeDoc {
  const { assetId, assetData, ownerData, existingMemeData, approverId, now } =
    input;
  const nowTimestamp = Timestamp.fromMillis(now);

  const dimensions = asRecord(assetData.dimensions);
  const storage = asRecord(assetData.storage);
  const urls = asRecord(assetData.urls);
  const moderation = asRecord(assetData.moderation);
  const ownerAvatar = asRecord(ownerData?.avatar);

  const title = asString(assetData.title).trim() || "Untitled";
  const description = asString(assetData.description).trim();
  const tags = normalizeTags(assetData.tags);
  const searchKeywords = buildSearchKeywordsFromTags(tags);

  const mimeType = asString(assetData.mimeType) || "image/jpeg";
  const animated =
    Boolean(assetData.isAnimated) || mimeType.toLowerCase() === "image/gif";

  const width = asFiniteNumber(dimensions?.width, 480);
  const existingWidth = asFiniteNumber(existingMemeData?.width, 480);
  const existingHeight = asFiniteNumber(existingMemeData?.height, 320);
  const height = asFiniteNumber(dimensions?.height, existingHeight);
  const aspectRatio = asFiniteNumber(
    dimensions?.aspectRatio,
    height > 0
      ? width / height
      : existingHeight > 0
        ? existingWidth / existingHeight
        : 1,
  );

  const imageUrl =
    asString(urls?.previewUrl) ||
    asString(urls?.originalUrl) ||
    asString(urls?.thumbnailUrl) ||
    asString(existingMemeData?.imageUrl);
  const thumbnailUrl =
    asString(urls?.thumbnailUrl) || asString(existingMemeData?.thumbnailUrl);
  const storagePath =
    asString(storage?.originalPath) || asString(existingMemeData?.storagePath);
  const uploadedBy =
    asString(assetData.ownerId) ||
    asString(existingMemeData?.uploadedBy) ||
    null;

  const displayName =
    asString(ownerData?.displayName).trim() ||
    asString(ownerData?.authDisplayName).trim() ||
    asString(ownerData?.username).trim();
  const avatarUrl = asString(ownerAvatar?.url).trim();
  const overlay =
    displayName.length > 0
      ? {
          avatar: avatarUrl,
          name: displayName,
        }
      : (asRecord(existingMemeData?.overlay) as MemeOverlayDoc | null);

  const scanResult = asString(moderation?.scanResult).toLowerCase();
  const sensitive = Boolean(moderation?.userSensitiveFlag);
  const nsfw = scanResult === "explicit";

  const createdAtMillis = asMillis(assetData.createdAt, now);
  const moderatedAtMillis = asMillis(
    moderation?.reviewedAt,
    asMillis(existingMemeData?.moderatedAt, now),
  );
  const publishedAtMillis = asMillis(existingMemeData?.publishedAt, now);
  const existingLikeCount = existingMemeData?.likeCount;
  const existingShareCount = existingMemeData?.shareCount;
  const existingDownloadCount = existingMemeData?.downloadCount;
  const existingPopularityScore = existingMemeData?.popularityScore;

  return {
    id: assetId,
    title,
    description,
    tags,
    searchKeywords,
    category: asString(existingMemeData?.category) || "uncategorized",
    templateName: asString(existingMemeData?.templateName),
    language: asString(existingMemeData?.language) || "en",
    imageUrl,
    storagePath,
    mimeType: mimeType || asString(existingMemeData?.mimeType) || "image/jpeg",
    animated,
    thumbnailUrl: thumbnailUrl || null,
    width: asFiniteNumber(dimensions?.width, existingWidth),
    height,
    aspectRatio,
    nsfw,
    sensitive,
    status: "approved",
    uploadedBy,
    overlay,
    moderatedBy:
      asString(moderation?.reviewedBy) ||
      asString(existingMemeData?.moderatedBy) ||
      approverId,
    moderatedAt: Timestamp.fromMillis(moderatedAtMillis),
    publishedAt: Timestamp.fromMillis(publishedAtMillis),
    updatedAt: nowTimestamp,
    createdAt: existingMemeData?.createdAt
      ? undefined
      : Timestamp.fromMillis(createdAtMillis),
    uploadedAt: existingMemeData?.uploadedAt
      ? undefined
      : Timestamp.fromMillis(createdAtMillis),
    likeCount:
      existingLikeCount == null ? 0 : asFiniteNumber(existingLikeCount, 0),
    shareCount:
      existingShareCount == null ? 0 : asFiniteNumber(existingShareCount, 0),
    downloadCount:
      existingDownloadCount == null
        ? 0
        : asFiniteNumber(existingDownloadCount, 0),
    popularityScore:
      existingPopularityScore == null
        ? 0
        : asFiniteNumber(existingPopularityScore, 0),
  };
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
  const visibility = normalizeVisibility(request.data?.visibility);
  const source = normalizeSourceInput(request.data?.source);
  const shouldAutoSubmitForReview = visibility === "public";
  const finalStatus: UploadAssetDoc["status"] = shouldAutoSubmitForReview
    ? "pending_review"
    : "uploaded";

  const tags = normalizeTags(request.data?.tags);
  const searchKeywords = buildSearchKeywordsFromTags(tags);

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
  const reviewEventRef = assetRef.collection("events").doc();

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
      searchKeywords,
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

    const reviewEvent = shouldAutoSubmitForReview
      ? createAssetEvent({
          id: reviewEventRef.id,
          assetId,
          actorId: uid,
          type: "submitted_for_review",
          metadata: {
            reasonCode: null,
            fromStatus: "uploaded",
            toStatus: "pending_review",
          },
          now,
        })
      : null;

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
        sourceUrl: source.sourceUrl,
        attributionText: source.attributionText,
      },
      status: finalStatus,
      visibility,
    });

    tx.set(eventRef, {
      ...uploadEvent,
      createdAt: Timestamp.fromMillis(uploadEvent.createdAt),
    });

    if (reviewEvent) {
      tx.set(reviewEventRef, {
        ...reviewEvent,
        createdAt: Timestamp.fromMillis(reviewEvent.createdAt),
      });
    }

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
    status: finalStatus,
    visibility,
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

export const approveUploadAsset = onCall<
  ApproveUploadAssetRequest,
  Promise<ApproveUploadAssetResponse>
>({ invoker: "public" }, async (request) => {
  const approverId = requireAuthUid(request.auth?.uid);
  requireAdminAuth(request.auth?.token);

  const now = Date.now();
  const assetId = requireNonEmptyString(request.data?.assetId, "assetId");
  const nowTimestamp = Timestamp.fromMillis(now);
  const assetRef = db.collection("assets").doc(assetId);
  const memeRef = db.collection("memes").doc(assetId);
  const eventRef = assetRef.collection("events").doc();

  let approved = false;
  let resultingStatus: UploadAssetDoc["status"] = "pending_review";

  await db.runTransaction(async (tx) => {
    const assetSnap = await tx.get(assetRef);
    if (!assetSnap.exists) {
      throw new HttpsError("not-found", "Asset not found.");
    }

    const assetData = assetSnap.data() as Record<string, unknown>;
    const asset = assetData as Partial<UploadAssetDoc>;
    const isAlreadyApproved =
      asset.status === "published" &&
      asset.visibility === "public" &&
      asRecord(assetData.moderation)?.finalDecision === "approved";

    if (asset.status !== "pending_review" && !isAlreadyApproved) {
      throw new HttpsError(
        "failed-precondition",
        "Only pending_review assets can be approved.",
      );
    }

    const ownerId = asString(assetData.ownerId);
    const ownerRef = ownerId ? userRefByUid(db, ownerId) : null;
    const [ownerSnap, memeSnap] = await Promise.all([
      ownerRef ? tx.get(ownerRef) : Promise.resolve(null),
      tx.get(memeRef),
    ]);
    const ownerData =
      ownerSnap && ownerSnap.exists
        ? (ownerSnap.data() as Record<string, unknown>)
        : null;
    const existingMemeData = memeSnap.exists
      ? (memeSnap.data() as Record<string, unknown>)
      : null;

    const memeDoc = mapApprovedAssetToMemeDoc({
      assetId,
      assetData,
      ownerData,
      existingMemeData,
      approverId,
      now,
    });

    if (!isAlreadyApproved) {
      const approvalEvent = createAssetEvent({
        id: eventRef.id,
        assetId,
        actorId: approverId,
        type: "approved",
        metadata: {
          reasonCode: null,
          fromStatus: "pending_review",
          toStatus: "published",
        },
        now,
      });

      tx.set(
        assetRef,
        {
          status: "published",
          visibility: "public",
          moderation: {
            finalDecision: "approved",
            decidedAt: nowTimestamp,
            decidedBy: approverId,
            reviewedAt: nowTimestamp,
            reviewedBy: approverId,
          },
          publishedAt: nowTimestamp,
          updatedAt: nowTimestamp,
        },
        { merge: true },
      );

      tx.set(eventRef, {
        ...approvalEvent,
        createdAt: nowTimestamp,
      });
    }

    tx.set(memeRef, memeDoc, { merge: true });

    resultingStatus = "published";
    approved = true;
  });

  return {
    assetId,
    status: resultingStatus,
    approved,
  };
});
