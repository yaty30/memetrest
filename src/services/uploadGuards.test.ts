import { describe, expect, it } from "vitest";
import {
  hasExceededUploadLimits,
  isEligibleForPublicPublish,
  isPublicAsset,
  isReviewableAssetStatus,
  isUploadSuspended,
} from "./uploadGuards";
import type { UploadAssetDoc, UserUploadProfile } from "../types/upload";

const baseProfile: UserUploadProfile = {
  canUpload: true,
  trustTier: "basic",
  limits: {
    dailyUploadLimit: 3,
    weeklyUploadLimit: 10,
    monthlyUploadLimit: 30,
    burstLimitPerHour: 2,
  },
  usage: {
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    hourlyCount: 0,
    lastUploadAt: null,
    dailyWindowStart: 0,
    weeklyWindowStart: 0,
    monthlyWindowStart: 0,
    hourlyWindowStart: 0,
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

const baseAsset: UploadAssetDoc = {
  id: "asset-1",
  ownerId: "user-1",
  ownerRoleAtUpload: "user",
  kind: "image",
  title: "asset",
  description: null,
  tags: [],
  searchKeywords: [],
  status: "uploaded",
  visibility: "private",
  mimeType: "image/jpeg",
  fileSize: 100,
  isAnimated: false,
  dimensions: {
    width: 100,
    height: 100,
    aspectRatio: 1,
  },
  storage: {
    originalPath: "uploads/quarantine/asset-1/original",
    previewPath: null,
    thumbnailPath: null,
  },
  urls: {
    originalUrl: null,
    previewUrl: null,
    thumbnailUrl: null,
  },
  source: {
    sourceType: "upload",
    sourceUrl: null,
    attributionText: null,
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
    uploadCompletedAt: null,
    metadataExtractedAt: null,
    derivativesGeneratedAt: null,
  },
  metrics: {
    views: 0,
    favorites: 0,
    shares: 0,
    comments: 0,
  },
  fileHash: null,
  createdAt: 1,
  updatedAt: 1,
  publishedAt: null,
  removedAt: null,
};

describe("upload guards", () => {
  it("isPublicAsset is strict on published+public", () => {
    expect(isPublicAsset({ status: "published", visibility: "public" })).toBe(
      true,
    );
    expect(isPublicAsset({ status: "published", visibility: "private" })).toBe(
      false,
    );
    expect(isPublicAsset({ status: "uploaded", visibility: "public" })).toBe(
      false,
    );
    expect(
      isPublicAsset({ status: "pending_review", visibility: "public" }),
    ).toBe(false);
    expect(isPublicAsset({ status: "rejected", visibility: "public" })).toBe(
      false,
    );
  });

  it("isPublicAsset does not depend on moderation state", () => {
    const publishedPublicNotApproved = {
      ...baseAsset,
      status: "published" as const,
      visibility: "public" as const,
      moderation: {
        ...baseAsset.moderation,
        finalDecision: "pending" as const,
      },
    };

    expect(isPublicAsset(publishedPublicNotApproved)).toBe(true);
  });

  it("isEligibleForPublicPublish requires moderation approved", () => {
    const candidate = {
      ...baseAsset,
      status: "published" as const,
      visibility: "public" as const,
      moderation: {
        ...baseAsset.moderation,
        finalDecision: "approved" as const,
      },
    };

    expect(isEligibleForPublicPublish(candidate)).toBe(true);
    expect(
      isEligibleForPublicPublish({
        ...candidate,
        moderation: { ...candidate.moderation, finalDecision: "pending" },
      }),
    ).toBe(false);
  });

  it("isUploadSuspended returns true when canUpload is false", () => {
    expect(isUploadSuspended({ ...baseProfile, canUpload: false }, 1000)).toBe(
      true,
    );
  });

  it("isUploadSuspended returns true before suspendedUntil", () => {
    expect(
      isUploadSuspended(
        {
          ...baseProfile,
          moderation: { ...baseProfile.moderation, suspendedUntil: 1500 },
        },
        1000,
      ),
    ).toBe(true);
  });

  it("hasExceededUploadLimits checks current windows", () => {
    const now = 1_000_000;
    const profile = {
      ...baseProfile,
      usage: {
        ...baseProfile.usage,
        dailyCount: 3,
        weeklyCount: 1,
        monthlyCount: 1,
        hourlyCount: 1,
        dailyWindowStart: now,
        weeklyWindowStart: now,
        monthlyWindowStart: now,
        hourlyWindowStart: now,
      },
    };

    expect(hasExceededUploadLimits(profile, now, 1)).toBe(true);
  });

  it("hasExceededUploadLimits ignores expired windows", () => {
    const now = 40 * 24 * 60 * 60 * 1000;
    const profile = {
      ...baseProfile,
      usage: {
        ...baseProfile.usage,
        dailyCount: 999,
        weeklyCount: 999,
        monthlyCount: 999,
        hourlyCount: 999,
        dailyWindowStart: 0,
        weeklyWindowStart: 0,
        monthlyWindowStart: 0,
        hourlyWindowStart: 0,
      },
    };

    expect(hasExceededUploadLimits(profile, now, 1)).toBe(false);
  });

  it("isReviewableAssetStatus returns true for uploaded and pending_review", () => {
    expect(isReviewableAssetStatus("uploaded")).toBe(true);
    expect(isReviewableAssetStatus("pending_review")).toBe(true);
    expect(isReviewableAssetStatus("published")).toBe(false);
  });
});
