import { describe, expect, it } from "vitest";
import {
  createAssetEvent,
  createDefaultUserUploadProfile,
  createInitialAssetDoc,
} from "./uploadDefaults";

describe("createDefaultUserUploadProfile", () => {
  it("creates basic defaults", () => {
    const profile = createDefaultUserUploadProfile("basic", 1_700_000_000_000);

    expect(profile.canUpload).toBe(true);
    expect(profile.limits).toEqual({
      dailyUploadLimit: 3,
      weeklyUploadLimit: 10,
      monthlyUploadLimit: 30,
      burstLimitPerHour: 2,
    });
    expect(profile.usage.dailyCount).toBe(0);
    expect(profile.usage.weeklyCount).toBe(0);
    expect(profile.usage.monthlyCount).toBe(0);
    expect(profile.usage.hourlyCount).toBe(0);
  });

  it("creates trusted defaults", () => {
    const profile = createDefaultUserUploadProfile(
      "trusted",
      1_700_000_000_000,
    );

    expect(profile.canUpload).toBe(true);
    expect(profile.limits).toEqual({
      dailyUploadLimit: 10,
      weeklyUploadLimit: 40,
      monthlyUploadLimit: 120,
      burstLimitPerHour: 5,
    });
  });

  it("creates restricted defaults", () => {
    const profile = createDefaultUserUploadProfile(
      "restricted",
      1_700_000_000_000,
    );

    expect(profile.canUpload).toBe(false);
    expect(profile.limits).toEqual({
      dailyUploadLimit: 0,
      weeklyUploadLimit: 0,
      monthlyUploadLimit: 0,
      burstLimitPerHour: 0,
    });
  });
});

describe("createInitialAssetDoc", () => {
  it("creates uploaded/private asset defaults", () => {
    const asset = createInitialAssetDoc({
      id: "asset-1",
      ownerId: "user-1",
      kind: "image",
      title: "First upload",
      mimeType: "image/jpeg",
      fileSize: 123,
      dimensions: {
        width: 1200,
        height: 600,
      },
      storage: {
        originalPath: "uploads/quarantine/asset-1/original",
        previewPath: null,
        thumbnailPath: null,
      },
      now: 123456,
    });

    expect(asset.status).toBe("uploaded");
    expect(asset.visibility).toBe("private");
    expect(asset.moderation.scanState).toBe("not_requested");
    expect(asset.moderation.scanResult).toBe("unknown");
    expect(asset.moderation.finalDecision).toBe("pending");
    expect(asset.processing.metadataState).toBe("pending");
    expect(asset.processing.derivativeState).toBe("pending");
    expect(asset.processing.hashState).toBe("pending");
    expect(asset.metrics).toEqual({
      views: 0,
      favorites: 0,
      shares: 0,
      comments: 0,
    });
    expect(asset.createdAt).toBe(123456);
    expect(asset.updatedAt).toBe(123456);
    expect(asset.isAnimated).toBe(false);
    expect(asset.dimensions.aspectRatio).toBe(2);
  });
});

describe("createAssetEvent", () => {
  it("creates an event with deterministic timestamp when provided", () => {
    const event = createAssetEvent({
      id: "evt-1",
      assetId: "asset-1",
      type: "upload_completed",
      now: 999,
    });

    expect(event).toEqual({
      id: "evt-1",
      assetId: "asset-1",
      actorId: null,
      type: "upload_completed",
      note: null,
      metadata: null,
      createdAt: 999,
    });
  });
});
