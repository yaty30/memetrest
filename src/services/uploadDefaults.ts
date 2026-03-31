import type {
  UploadAssetDoc,
  UploadAssetEventDoc,
  UploadAssetEventMetadata,
  UploadAssetEventType,
  UploadAssetKind,
  UploadAssetSourceInfo,
  UploadAssetStoragePaths,
  UploadAssetUrls,
  UploadTrustTier,
  UploadUserRole,
  UserUploadLimits,
  UserUploadProfile,
} from "../types/upload";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

function getLimitsForTier(trustTier: UploadTrustTier): UserUploadLimits {
  if (trustTier === "trusted") {
    return {
      dailyUploadLimit: 10,
      weeklyUploadLimit: 40,
      monthlyUploadLimit: 120,
      burstLimitPerHour: 5,
    };
  }

  if (trustTier === "restricted") {
    return {
      dailyUploadLimit: 0,
      weeklyUploadLimit: 0,
      monthlyUploadLimit: 0,
      burstLimitPerHour: 0,
    };
  }

  // TODO: restore production limits: daily=3, weekly=10, monthly=30, burst=2
  return {
    dailyUploadLimit: 9999,
    weeklyUploadLimit: 9999,
    monthlyUploadLimit: null,
    burstLimitPerHour: null,
  };
}

function floorToWindow(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function createDefaultUserUploadProfile(
  trustTier: UploadTrustTier = "basic",
  now = Date.now(),
): UserUploadProfile {
  return {
    canUpload: trustTier !== "restricted",
    trustTier,
    limits: getLimitsForTier(trustTier),
    usage: {
      dailyCount: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      hourlyCount: 0,
      lastUploadAt: null,
      dailyWindowStart: floorToWindow(now, DAY_MS),
      weeklyWindowStart: floorToWindow(now, WEEK_MS),
      monthlyWindowStart: floorToWindow(now, MONTH_MS),
      hourlyWindowStart: floorToWindow(now, HOUR_MS),
    },
    moderation: {
      approvalCount: 0,
      rejectionCount: 0,
      removedAfterPublishCount: 0,
      strikeCount: 0,
      suspendedUntil: null,
      lastRejectedAt: null,
      lastStrikeAt: null,
    },
  };
}

export interface CreateInitialAssetDocInput {
  id: string;
  ownerId: string;
  ownerRoleAtUpload?: UploadUserRole | null;
  kind: UploadAssetKind;
  title: string;
  description?: string | null;
  tags?: string[];
  searchKeywords?: string[];
  mimeType: string;
  fileSize: number;
  isAnimated?: boolean;
  dimensions: {
    width: number;
    height: number;
    aspectRatio?: number;
  };
  storage: UploadAssetStoragePaths;
  urls?: Partial<UploadAssetUrls>;
  source?: Partial<UploadAssetSourceInfo>;
  fileHash?: string | null;
  now?: number;
}

export function createInitialAssetDoc(
  input: CreateInitialAssetDocInput,
): UploadAssetDoc {
  const now = input.now ?? Date.now();
  const width = input.dimensions.width;
  const height = input.dimensions.height;

  return {
    id: input.id,
    ownerId: input.ownerId,
    ownerRoleAtUpload: input.ownerRoleAtUpload ?? null,
    kind: input.kind,
    title: input.title,
    description: input.description ?? null,
    tags: input.tags ?? [],
    searchKeywords: input.searchKeywords ?? [],
    status: "uploaded",
    visibility: "private",
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    isAnimated:
      input.isAnimated ??
      (input.kind === "gif" || input.mimeType.toLowerCase() === "image/gif"),
    dimensions: {
      width,
      height,
      aspectRatio:
        input.dimensions.aspectRatio ?? (height === 0 ? 1 : width / height),
    },
    storage: {
      originalPath: input.storage.originalPath,
      previewPath: input.storage.previewPath ?? null,
      thumbnailPath: input.storage.thumbnailPath ?? null,
    },
    urls: {
      originalUrl: input.urls?.originalUrl ?? null,
      previewUrl: input.urls?.previewUrl ?? null,
      thumbnailUrl: input.urls?.thumbnailUrl ?? null,
    },
    source: {
      sourceType: input.source?.sourceType ?? "upload",
      sourceUrl: input.source?.sourceUrl ?? null,
      attributionText: input.source?.attributionText ?? null,
    },
    moderation: {
      userSensitiveFlag: false,
      scanState: "not_requested",
      scanResult: "unknown",
      finalDecision: "pending",
      rejectionReasonCode: null,
      rejectionReasonText: null,
      reviewedBy: null,
      reviewedAt: null,
    },
    processing: {
      metadataState: "pending",
      derivativeState: "pending",
      hashState: "pending",
      failedReason: null,
      uploadCompletedAt: now,
      metadataExtractedAt: null,
      derivativesGeneratedAt: null,
    },
    metrics: {
      views: 0,
      favorites: 0,
      shares: 0,
      comments: 0,
    },
    fileHash: input.fileHash ?? null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    removedAt: null,
  };
}

export interface CreateAssetEventInput {
  id: string;
  assetId: string;
  type: UploadAssetEventType;
  actorId?: string | null;
  note?: string | null;
  metadata?: UploadAssetEventMetadata | null;
  now?: number;
}

export function createAssetEvent(
  input: CreateAssetEventInput,
): UploadAssetEventDoc {
  return {
    id: input.id,
    assetId: input.assetId,
    actorId: input.actorId ?? null,
    type: input.type,
    note: input.note ?? null,
    metadata: input.metadata ?? null,
    createdAt: input.now ?? Date.now(),
  };
}
