import { describe, expect, it } from "vitest";
import {
  getPublicOriginalPath,
  getPublicPreviewPath,
  getPublicThumbnailPath,
  getQuarantineOriginalPath,
  getQuarantinePreviewPath,
  getQuarantineThumbnailPath,
} from "./uploadStoragePaths";

describe("uploadStoragePaths", () => {
  it("builds quarantine paths", () => {
    expect(getQuarantineOriginalPath("asset-1")).toBe(
      "uploads/quarantine/asset-1/original",
    );
    expect(getQuarantinePreviewPath("asset-1")).toBe(
      "uploads/quarantine/asset-1/preview",
    );
    expect(getQuarantineThumbnailPath("asset-1")).toBe(
      "uploads/quarantine/asset-1/thumbnail",
    );
  });

  it("builds public paths", () => {
    expect(getPublicOriginalPath("asset-1")).toBe(
      "uploads/public/asset-1/original",
    );
    expect(getPublicPreviewPath("asset-1")).toBe(
      "uploads/public/asset-1/preview",
    );
    expect(getPublicThumbnailPath("asset-1")).toBe(
      "uploads/public/asset-1/thumbnail",
    );
  });

  it("throws when assetId is empty", () => {
    expect(() => getPublicOriginalPath("   ")).toThrow(/assetId is required/i);
  });
});
