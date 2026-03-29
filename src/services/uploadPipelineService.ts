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
import type { UploadAssetStatus, UploadAssetVisibility } from "../types/upload";

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
  tags?: string[];
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

function mapUserUploadAsset(
  id: string,
  data: Record<string, unknown>,
): UserUploadAssetListItem {
  const now = Date.now();
  const title = asString(data.title, "").trim();
  const dimensions =
    typeof data.dimensions === "object" && data.dimensions !== null
      ? (data.dimensions as Record<string, unknown>)
      : {};
  const urls =
    typeof data.urls === "object" && data.urls !== null
      ? (data.urls as Record<string, unknown>)
      : {};

  return {
    id,
    title,
    status: asString(data.status, "uploaded") as UploadAssetStatus,
    visibility: asString(data.visibility, "private") as UploadAssetVisibility,
    createdAt: toMillis(data.createdAt, now),
    mimeType: asString(data.mimeType, "unknown"),
    dimensions: {
      width: asNumber(dimensions.width),
      height: asNumber(dimensions.height),
    },
    previewUrl: asString(urls.previewUrl, "") || null,
    thumbnailUrl: asString(urls.thumbnailUrl, "") || null,
    originalUrl: asString(urls.originalUrl, "") || null,
  };
}

export function subscribeToUserUploadAssets(
  ownerId: string,
  onData: (items: UserUploadAssetListItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const assetsRef = collection(db, "assets");
  const ownerAssetsQuery = query(
    assetsRef,
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc"),
    limit(100),
  );

  return onSnapshot(
    ownerAssetsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Record<string, unknown>;
        return mapUserUploadAsset(docSnap.id, raw);
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
    tags: normalizeTags(metadata.tags),
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
