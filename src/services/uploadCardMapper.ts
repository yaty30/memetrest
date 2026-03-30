import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import type {
  UploadAssetDoc,
  UploadAssetStatus,
  UploadAssetVisibility,
} from "../types/upload";

export interface UploadCardModel {
  id: string;
  title: string;
  previewUrl: string | null;
  mimeType: string;
  width: number;
  height: number;
  createdAt: number;
  reviewStatus: UploadAssetStatus;
  visibility: UploadAssetVisibility;
}

const resolvedStorageUrlCache = new Map<string, Promise<string | null>>();

function asRenderableUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const lowered = normalized.toLowerCase();
  if (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("data:image/")
  ) {
    return normalized;
  }

  return null;
}

async function resolveStoragePathUrl(path: string | null | undefined) {
  if (!path) return null;
  const normalizedPath = path.trim();
  if (!normalizedPath) return null;

  const asUrl = asRenderableUrl(normalizedPath);
  if (asUrl) return asUrl;

  const cached = resolvedStorageUrlCache.get(normalizedPath);
  if (cached) return cached;

  const resolver = getDownloadURL(ref(storage, normalizedPath)).catch(
    () => null,
  );
  resolvedStorageUrlCache.set(normalizedPath, resolver);
  return resolver;
}

export async function mapUploadAssetToCardModel(
  asset: UploadAssetDoc,
): Promise<UploadCardModel> {
  const directPreviewUrl =
    asRenderableUrl(asset.urls.previewUrl) ??
    asRenderableUrl(asset.urls.thumbnailUrl) ??
    asRenderableUrl(asset.urls.originalUrl);

  const previewUrl =
    directPreviewUrl ??
    (await resolveStoragePathUrl(asset.storage.previewPath)) ??
    (await resolveStoragePathUrl(asset.storage.thumbnailPath)) ??
    (await resolveStoragePathUrl(asset.storage.originalPath));

  return {
    id: asset.id,
    title: asset.title,
    previewUrl,
    mimeType: asset.mimeType,
    width: asset.dimensions.width,
    height: asset.dimensions.height,
    createdAt: asset.createdAt,
    reviewStatus: asset.status,
    visibility: asset.visibility,
  };
}
