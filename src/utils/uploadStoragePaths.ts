function assertAssetId(assetId: string): string {
  const normalized = assetId.trim();
  if (!normalized) {
    throw new Error("assetId is required to build upload storage paths");
  }
  return normalized;
}

function buildPath(
  scope: "quarantine" | "public",
  assetId: string,
  variant: "original" | "preview" | "thumbnail",
): string {
  return `uploads/${scope}/${assertAssetId(assetId)}/${variant}`;
}

export function getQuarantineOriginalPath(assetId: string): string {
  return buildPath("quarantine", assetId, "original");
}

export function getQuarantinePreviewPath(assetId: string): string {
  return buildPath("quarantine", assetId, "preview");
}

export function getQuarantineThumbnailPath(assetId: string): string {
  return buildPath("quarantine", assetId, "thumbnail");
}

export function getPublicOriginalPath(assetId: string): string {
  return buildPath("public", assetId, "original");
}

export function getPublicPreviewPath(assetId: string): string {
  return buildPath("public", assetId, "preview");
}

export function getPublicThumbnailPath(assetId: string): string {
  return buildPath("public", assetId, "thumbnail");
}
