import type {
  UploadAssetDoc,
  UploadAssetStatus,
  UserUploadProfile,
} from "../types/upload";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

function isCurrentWindow(
  windowStart: number,
  now: number,
  windowDurationMs: number,
): boolean {
  return now >= windowStart && now - windowStart < windowDurationMs;
}

function wouldExceedLimit(
  currentCount: number,
  increment: number,
  limit: number | null,
): boolean {
  if (limit === null) return false;
  return currentCount + increment > limit;
}

export function isPublicAsset(
  asset: Pick<UploadAssetDoc, "status" | "visibility">,
): boolean {
  return asset.status === "published" && asset.visibility === "public";
}

export function isEligibleForPublicPublish(
  asset: Pick<UploadAssetDoc, "status" | "visibility" | "moderation">,
): boolean {
  return (
    asset.status === "published" &&
    asset.visibility === "public" &&
    asset.moderation.finalDecision === "approved"
  );
}

export function isUploadSuspended(
  uploadProfile: Pick<UserUploadProfile, "canUpload" | "moderation">,
  now = Date.now(),
): boolean {
  if (!uploadProfile.canUpload) return true;
  const suspendedUntil = uploadProfile.moderation.suspendedUntil;
  return suspendedUntil !== null && suspendedUntil > now;
}

export function hasExceededUploadLimits(
  uploadProfile: Pick<UserUploadProfile, "limits" | "usage">,
  now = Date.now(),
  nextCountIncrement = 1,
): boolean {
  const usage = uploadProfile.usage;
  const limits = uploadProfile.limits;

  const dailyCount = isCurrentWindow(usage.dailyWindowStart, now, DAY_MS)
    ? usage.dailyCount
    : 0;
  const weeklyCount = isCurrentWindow(usage.weeklyWindowStart, now, WEEK_MS)
    ? usage.weeklyCount
    : 0;
  const monthlyCount = isCurrentWindow(usage.monthlyWindowStart, now, MONTH_MS)
    ? usage.monthlyCount
    : 0;
  const hourlyCount = isCurrentWindow(usage.hourlyWindowStart, now, HOUR_MS)
    ? usage.hourlyCount
    : 0;

  return (
    wouldExceedLimit(dailyCount, nextCountIncrement, limits.dailyUploadLimit) ||
    wouldExceedLimit(
      weeklyCount,
      nextCountIncrement,
      limits.weeklyUploadLimit,
    ) ||
    wouldExceedLimit(
      monthlyCount,
      nextCountIncrement,
      limits.monthlyUploadLimit,
    ) ||
    wouldExceedLimit(hourlyCount, nextCountIncrement, limits.burstLimitPerHour)
  );
}

export function isReviewableAssetStatus(status: UploadAssetStatus): boolean {
  return status === "uploaded" || status === "pending_review";
}
