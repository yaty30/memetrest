import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
import { FirebaseError } from "firebase/app";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { functionsClient, storage } from "../../firebase";
import { db } from "../../firebase";
import type {
  UploadAssetDoc,
  UploadAssetStatus,
  UploadAssetVisibility,
} from "../types/upload";

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
  tags?: string[];
  visibility?: UploadAssetVisibility;
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
  status: "uploaded" | "pending_review" | "published" | "rejected" | "removed";
  visibility: "private" | "public";
  createdAt: number;
}

interface SubmitAssetForReviewRequest {
  assetId: string;
  note?: string | null;
}

interface SubmitAssetForReviewResponse {
  assetId: string;
  status: "uploaded" | "pending_review" | "published" | "rejected" | "removed";
  submitted: boolean;
}

export interface UploadAssetMetadataInput {
  title: string;
  description?: string | null;
  source?: string | null;
  tags?: string[];
  visibility?: UploadAssetVisibility;
  fileHash?: string | null;
}

export interface UploadPipelineResult {
  assetId: string;
  status: FinalizeUploadAssetResponse["status"];
  visibility: FinalizeUploadAssetResponse["visibility"];
  createdAt: number;
}

export interface UserUploadAssetListItem {
  id: string;
  title: string;
  status: UploadAssetStatus;
  visibility: UploadAssetVisibility;
  createdAt: number;
  mimeType: string;
  dimensions: {
    width: number;
    height: number;
  };
  previewUrl: string | null;
  thumbnailUrl: string | null;
  originalUrl: string | null;
}

export type UserUploadsVisibility = "owner" | "public";

interface UserUploadsQueryOptions {
  visibility?: UserUploadsVisibility;
  pageSize?: number;
}

type TimestampLike = {
  toMillis: () => number;
};

function toCallableError(operation: string, error: unknown): Error {
  if (error instanceof FirebaseError) {
    const code = error.code || "unknown";
    const message = error.message || "Unknown callable error";
    return new Error(`${operation} failed (${code}): ${message}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(`${operation} failed.`);
}

function getImageDimensions(file: File): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      URL.revokeObjectURL(objectUrl);

      if (!width || !height) {
        reject(new Error("Unable to read image dimensions."));
        return;
      }

      resolve({
        width,
        height,
        aspectRatio: width / height,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load image for metadata extraction."));
    };

    image.src = objectUrl;
  });
}

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .slice(0, 30);
}

function toMillis(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TimestampLike).toMillis === "function"
  ) {
    return (value as TimestampLike).toMillis();
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapUserUploadAsset(asset: UploadAssetDoc): UserUploadAssetListItem {
  return {
    id: asset.id,
    title: asset.title,
    status: asset.status,
    visibility: asset.visibility,
    createdAt: asset.createdAt,
    mimeType: asset.mimeType,
    dimensions: {
      width: asset.dimensions.width,
      height: asset.dimensions.height,
    },
    previewUrl: asset.urls.previewUrl,
    thumbnailUrl: asset.urls.thumbnailUrl,
    originalUrl: asset.urls.originalUrl,
  };
}

function mapUploadAssetDoc(
  id: string,
  data: Record<string, unknown>,
): UploadAssetDoc {
  const now = Date.now();
  const title = asString(data.title, "").trim();
  const ownerId = asString(data.ownerId, "");
  const descriptionRaw = data.description;
  const tagsRaw = Array.isArray(data.tags) ? data.tags : [];
  const searchKeywordsRaw = Array.isArray(data.searchKeywords)
    ? data.searchKeywords
    : [];
  const storageRaw =
    typeof data.storage === "object" && data.storage !== null
      ? (data.storage as Record<string, unknown>)
      : {};
  const sourceRaw =
    typeof data.source === "object" && data.source !== null
      ? (data.source as Record<string, unknown>)
      : {};
  const moderationRaw =
    typeof data.moderation === "object" && data.moderation !== null
      ? (data.moderation as Record<string, unknown>)
      : {};
  const processingRaw =
    typeof data.processing === "object" && data.processing !== null
      ? (data.processing as Record<string, unknown>)
      : {};
  const mediaRaw =
    typeof data.media === "object" && data.media !== null
      ? (data.media as Record<string, unknown>)
      : {};
  const fileRaw =
    typeof data.file === "object" && data.file !== null
      ? (data.file as Record<string, unknown>)
      : {};
  const metricsRaw =
    typeof data.metrics === "object" && data.metrics !== null
      ? (data.metrics as Record<string, unknown>)
      : {};
  const dimensions =
    typeof data.dimensions === "object" && data.dimensions !== null
      ? (data.dimensions as Record<string, unknown>)
      : {};
  const urls =
    typeof data.urls === "object" && data.urls !== null
      ? (data.urls as Record<string, unknown>)
      : {};
  const topLevelStoragePath =
    asString(data.storagePath, "") ||
    asString(data.finalPath, "") ||
    asString(data.quarantinePath, "");
  const topLevelPreviewPath = asString(data.previewPath, "");
  const topLevelThumbnailPath = asString(data.thumbnailPath, "");
  const topLevelPreviewUrl = asString(data.previewUrl, "");
  const topLevelThumbnailUrl = asString(data.thumbnailUrl, "");
  const topLevelDownloadUrl =
    asString(data.downloadURL, "") || asString(data.downloadUrl, "");
  const mediaUrl = asString(mediaRaw.url, "");
  const fileUrl = asString(fileRaw.url, "");

  return {
    id,
    ownerId,
    ownerRoleAtUpload: (asString(data.ownerRoleAtUpload, "") ||
      null) as UploadAssetDoc["ownerRoleAtUpload"],
    kind: (asString(data.kind, "image") || "image") as UploadAssetDoc["kind"],
    title,
    description:
      descriptionRaw == null ? null : asString(descriptionRaw, null as never),
    tags: tagsRaw
      .map((tag) => asString(tag, "").trim())
      .filter((tag) => tag.length > 0),
    searchKeywords: searchKeywordsRaw
      .map((keyword) => asString(keyword, "").trim().toLowerCase())
      .filter((keyword) => keyword.length > 0),
    status: asString(data.status, "uploaded") as UploadAssetStatus,
    visibility: asString(data.visibility, "private") as UploadAssetVisibility,
    mimeType: asString(data.mimeType, "unknown"),
    fileSize: asNumber(data.fileSize),
    isAnimated: Boolean(data.isAnimated),
    dimensions: {
      width: asNumber(dimensions.width),
      height: asNumber(dimensions.height),
      aspectRatio: asNumber(dimensions.aspectRatio),
    },
    storage: {
      originalPath:
        asString(storageRaw.originalPath, "") || topLevelStoragePath,
      previewPath:
        asString(storageRaw.previewPath, "") || topLevelPreviewPath || null,
      thumbnailPath:
        asString(storageRaw.thumbnailPath, "") || topLevelThumbnailPath || null,
    },
    urls: {
      originalUrl:
        asString(urls.originalUrl, "") ||
        topLevelDownloadUrl ||
        mediaUrl ||
        fileUrl ||
        null,
      previewUrl: asString(urls.previewUrl, "") || topLevelPreviewUrl || null,
      thumbnailUrl:
        asString(urls.thumbnailUrl, "") || topLevelThumbnailUrl || null,
    },
    source: {
      sourceType: (asString(sourceRaw.sourceType, "upload") ||
        "upload") as UploadAssetDoc["source"]["sourceType"],
      sourceUrl: asString(sourceRaw.sourceUrl, "") || null,
      attributionText: asString(sourceRaw.attributionText, "") || null,
    },
    moderation: {
      userSensitiveFlag: Boolean(moderationRaw.userSensitiveFlag),
      scanState: (asString(moderationRaw.scanState, "not_requested") ||
        "not_requested") as UploadAssetDoc["moderation"]["scanState"],
      scanResult: (asString(moderationRaw.scanResult, "unknown") ||
        "unknown") as UploadAssetDoc["moderation"]["scanResult"],
      finalDecision: (asString(moderationRaw.finalDecision, "pending") ||
        "pending") as UploadAssetDoc["moderation"]["finalDecision"],
      rejectionReasonCode: (asString(moderationRaw.rejectionReasonCode, "") ||
        null) as UploadAssetDoc["moderation"]["rejectionReasonCode"],
      rejectionReasonText:
        asString(moderationRaw.rejectionReasonText, "") || null,
      reviewedBy: asString(moderationRaw.reviewedBy, "") || null,
      reviewedAt: toMillis(moderationRaw.reviewedAt, now),
    },
    processing: {
      metadataState: (asString(processingRaw.metadataState, "pending") ||
        "pending") as UploadAssetDoc["processing"]["metadataState"],
      derivativeState: (asString(processingRaw.derivativeState, "pending") ||
        "pending") as UploadAssetDoc["processing"]["derivativeState"],
      hashState: (asString(processingRaw.hashState, "pending") ||
        "pending") as UploadAssetDoc["processing"]["hashState"],
      failedReason: asString(processingRaw.failedReason, "") || null,
      uploadCompletedAt: toMillis(processingRaw.uploadCompletedAt, now),
      metadataExtractedAt: toMillis(processingRaw.metadataExtractedAt, now),
      derivativesGeneratedAt: toMillis(
        processingRaw.derivativesGeneratedAt,
        now,
      ),
    },
    metrics: {
      views: asNumber(metricsRaw.views),
      favorites: asNumber(metricsRaw.favorites),
      shares: asNumber(metricsRaw.shares),
      comments: asNumber(metricsRaw.comments),
    },
    fileHash: asString(data.fileHash, "") || null,
    createdAt: toMillis(data.createdAt, now),
    updatedAt: toMillis(data.updatedAt, now),
    publishedAt: toMillis(data.publishedAt, now),
    removedAt: toMillis(data.removedAt, now),
  };
}

function asNullableMillis(value: unknown): number | null {
  if (value == null) return null;
  return toMillis(value, Date.now());
}

function toUploadAssetDoc(
  id: string,
  data: Record<string, unknown>,
): UploadAssetDoc {
  const now = Date.now();
  const parsed = mapUploadAssetDoc(id, data);

  return {
    ...parsed,
    description: parsed.description,
    publishedAt: asNullableMillis(data.publishedAt),
    removedAt: asNullableMillis(data.removedAt),
    moderation: {
      ...parsed.moderation,
      reviewedAt: asNullableMillis(
        (data.moderation as Record<string, unknown> | undefined)?.reviewedAt,
      ),
    },
    processing: {
      ...parsed.processing,
      uploadCompletedAt: asNullableMillis(
        (data.processing as Record<string, unknown> | undefined)
          ?.uploadCompletedAt,
      ),
      metadataExtractedAt: asNullableMillis(
        (data.processing as Record<string, unknown> | undefined)
          ?.metadataExtractedAt,
      ),
      derivativesGeneratedAt: asNullableMillis(
        (data.processing as Record<string, unknown> | undefined)
          ?.derivativesGeneratedAt,
      ),
    },
    createdAt: toMillis(data.createdAt, now),
    updatedAt: toMillis(data.updatedAt, now),
  };
}

export function subscribeToUserUploads(
  ownerId: string,
  onData: (items: UploadAssetDoc[]) => void,
  onError?: (error: Error) => void,
  options: UserUploadsQueryOptions = {},
): Unsubscribe {
  const { visibility = "owner", pageSize = 100 } = options;
  const assetsRef = collection(db, "assets");
  const constraints = [
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  ];

  if (visibility === "public") {
    constraints.unshift(where("status", "==", "published"));
    constraints.unshift(where("visibility", "==", "public"));
  }

  const ownerAssetsQuery = query(assetsRef, ...constraints);

  return onSnapshot(
    ownerAssetsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Record<string, unknown>;
        return toUploadAssetDoc(docSnap.id, raw);
      });
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    },
  );
}

export function subscribeToUserUploadAssets(
  ownerId: string,
  onData: (items: UserUploadAssetListItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return subscribeToUserUploads(
    ownerId,
    (uploads) => {
      onData(uploads.map((upload) => mapUserUploadAsset(upload)));
    },
    onError,
    {
      visibility: "owner",
      pageSize: 100,
    },
  );
}

export async function initializeUpload(
  input: InitializeUploadRequest,
): Promise<InitializeUploadResponse> {
  try {
    const callable = httpsCallable<
      InitializeUploadRequest,
      InitializeUploadResponse
    >(functionsClient, "initializeUpload");
    const result = await callable(input);
    return result.data;
  } catch (error) {
    throw toCallableError("initializeUpload", error);
  }
}

export async function finalizeUploadAsset(
  input: FinalizeUploadAssetRequest,
): Promise<FinalizeUploadAssetResponse> {
  try {
    const callable = httpsCallable<
      FinalizeUploadAssetRequest,
      FinalizeUploadAssetResponse
    >(functionsClient, "finalizeUploadAsset");
    const result = await callable(input);
    return result.data;
  } catch (error) {
    throw toCallableError("finalizeUploadAsset", error);
  }
}

export async function submitAssetForReview(
  input: SubmitAssetForReviewRequest,
): Promise<SubmitAssetForReviewResponse> {
  try {
    const callable = httpsCallable<
      SubmitAssetForReviewRequest,
      SubmitAssetForReviewResponse
    >(functionsClient, "submitAssetForReview");
    const result = await callable(input);
    return result.data;
  } catch (error) {
    throw toCallableError("submitAssetForReview", error);
  }
}

export async function uploadAssetThroughBackend(
  file: File,
  metadata: UploadAssetMetadataInput,
): Promise<UploadPipelineResult> {
  const dimensions = await getImageDimensions(file);

  const init = await initializeUpload({
    mimeType: file.type,
    fileSize: file.size,
  });

  const originalRef = ref(storage, init.quarantinePaths.originalPath);
  await uploadBytes(originalRef, file, {
    contentType: file.type,
  });

  const finalized = await finalizeUploadAsset({
    assetId: init.assetId,
    title: metadata.title,
    description: metadata.description ?? null,
    source: metadata.source ?? null,
    tags: normalizeTags(metadata.tags),
    visibility: metadata.visibility ?? "private",
    mimeType: file.type,
    fileSize: file.size,
    dimensions,
    fileHash: metadata.fileHash ?? null,
  });

  return {
    assetId: finalized.assetId,
    status: finalized.status,
    visibility: finalized.visibility,
    createdAt: finalized.createdAt,
  };
}
