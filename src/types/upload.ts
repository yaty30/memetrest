/** Upload-domain user roles for moderation and operator visibility. */
export const UPLOAD_USER_ROLES = ["user", "moderator", "admin"] as const;
export type UploadUserRole = (typeof UPLOAD_USER_ROLES)[number];

/** Upload trust tiers for differentiated limits and risk controls. */
export const UPLOAD_TRUST_TIERS = ["basic", "trusted", "restricted"] as const;
export type UploadTrustTier = (typeof UPLOAD_TRUST_TIERS)[number];

/** Upload lifecycle status. Upload is not publish. */
export const UPLOAD_ASSET_STATUSES = [
  "uploaded",
  "pending_review",
  "published",
  "rejected",
  "removed",
] as const;
export type UploadAssetStatus = (typeof UPLOAD_ASSET_STATUSES)[number];

/** Upload visibility state. Public visibility requires published + public. */
export const UPLOAD_ASSET_VISIBILITIES = ["private", "public"] as const;
export type UploadAssetVisibility = (typeof UPLOAD_ASSET_VISIBILITIES)[number];

/** Supported upload media kinds. */
export const UPLOAD_ASSET_KINDS = ["image", "gif"] as const;
export type UploadAssetKind = (typeof UPLOAD_ASSET_KINDS)[number];

/** Processing state is independent from lifecycle status. */
export const UPLOAD_PROCESSING_STATES = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;
export type UploadProcessingState = (typeof UPLOAD_PROCESSING_STATES)[number];

/** Moderation scan execution state. */
export const UPLOAD_MODERATION_SCAN_STATES = [
  "not_requested",
  "queued",
  "running",
  "completed",
  "failed",
] as const;
export type UploadModerationScanState =
  (typeof UPLOAD_MODERATION_SCAN_STATES)[number];

/** Moderation scan result classification. */
export const UPLOAD_MODERATION_SCAN_RESULTS = [
  "unknown",
  "clean",
  "borderline",
  "explicit",
] as const;
export type UploadModerationScanResult =
  (typeof UPLOAD_MODERATION_SCAN_RESULTS)[number];

/** Human/system moderation decision, separate from lifecycle. */
export const UPLOAD_MODERATION_DECISIONS = [
  "pending",
  "approved",
  "rejected",
] as const;
export type UploadModerationDecision =
  (typeof UPLOAD_MODERATION_DECISIONS)[number];

/** Canonical rejection reasons for reporting and analytics. */
export const UPLOAD_REJECTION_REASON_CODES = [
  "policy_explicit",
  "policy_violence",
  "policy_hate",
  "spam",
  "duplicate",
  "low_quality",
  "invalid_file",
  "copyright",
  "other",
] as const;
export type UploadRejectionReasonCode =
  (typeof UPLOAD_REJECTION_REASON_CODES)[number];

export interface UserUploadLimits {
  dailyUploadLimit: number;
  weeklyUploadLimit: number;
  monthlyUploadLimit: number | null;
  burstLimitPerHour: number | null;
}

export interface UserUploadUsage {
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  hourlyCount: number;
  lastUploadAt: number | null;
  dailyWindowStart: number;
  weeklyWindowStart: number;
  monthlyWindowStart: number;
  hourlyWindowStart: number;
}

export interface UserModerationHealth {
  approvalCount: number;
  rejectionCount: number;
  removedAfterPublishCount: number;
  strikeCount: number;
  suspendedUntil: number | null;
  lastRejectedAt: number | null;
  lastStrikeAt: number | null;
}

export interface UserUploadProfile {
  canUpload: boolean;
  trustTier: UploadTrustTier;
  limits: UserUploadLimits;
  usage: UserUploadUsage;
  moderation: UserModerationHealth;
}

export interface UploadAssetStoragePaths {
  originalPath: string;
  previewPath: string | null;
  thumbnailPath: string | null;
}

export interface UploadAssetUrls {
  originalUrl: string | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
}

export interface UploadAssetDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface UploadAssetSourceInfo {
  sourceType: "upload" | "external";
  sourceUrl: string | null;
  attributionText: string | null;
}

export interface UploadAssetModeration {
  userSensitiveFlag: boolean;
  scanState: UploadModerationScanState;
  scanResult: UploadModerationScanResult;
  finalDecision: UploadModerationDecision;
  rejectionReasonCode: UploadRejectionReasonCode | null;
  rejectionReasonText: string | null;
  reviewedBy: string | null;
  reviewedAt: number | null;
}

export interface UploadAssetProcessing {
  metadataState: UploadProcessingState;
  derivativeState: UploadProcessingState;
  hashState: UploadProcessingState;
  failedReason: string | null;
  uploadCompletedAt: number | null;
  metadataExtractedAt: number | null;
  derivativesGeneratedAt: number | null;
}

export interface UploadAssetMetrics {
  views: number;
  favorites: number;
  shares: number;
  comments: number;
}

/**
 * Upload-domain asset contract.
 * This model is additive and isolated from legacy meme runtime contracts.
 */
export interface UploadAssetDoc {
  id: string;
  ownerId: string;
  ownerRoleAtUpload: UploadUserRole | null;

  kind: UploadAssetKind;
  title: string;
  description: string | null;
  tags: string[];

  status: UploadAssetStatus;
  visibility: UploadAssetVisibility;

  mimeType: string;
  fileSize: number;
  isAnimated: boolean;
  dimensions: UploadAssetDimensions;

  storage: UploadAssetStoragePaths;
  urls: UploadAssetUrls;

  source: UploadAssetSourceInfo;

  moderation: UploadAssetModeration;
  processing: UploadAssetProcessing;
  metrics: UploadAssetMetrics;

  fileHash: string | null;

  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  removedAt: number | null;
}

export const UPLOAD_ASSET_EVENT_TYPES = [
  "upload_started",
  "upload_completed",
  "processing_started",
  "metadata_extracted",
  "derivatives_generated",
  "submitted_for_review",
  "scan_requested",
  "scan_completed",
  "approved",
  "rejected",
  "published",
  "removed",
  "processing_failed",
] as const;
export type UploadAssetEventType = (typeof UPLOAD_ASSET_EVENT_TYPES)[number];

export interface UploadAssetEventMetadata {
  reasonCode: UploadRejectionReasonCode | null;
  fromStatus: UploadAssetStatus | null;
  toStatus: UploadAssetStatus | null;
}

export interface UploadAssetEventDoc {
  id: string;
  assetId: string;
  actorId: string | null;
  type: UploadAssetEventType;
  note: string | null;
  metadata: UploadAssetEventMetadata | null;
  createdAt: number;
}
