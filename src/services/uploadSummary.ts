interface UploadCountSummary {
  totalCount: number;
  publishedCount: number;
}

export function getProfileVisibleUploadCount(
  summary: UploadCountSummary,
  isOwnerView: boolean,
): number {
  return isOwnerView ? summary.totalCount : summary.publishedCount;
}
