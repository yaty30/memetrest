import type { MemeService } from "./memeService";
import { MockMemeService } from "./mockMemeService";
import { FirebaseMemeService } from "./firebaseMemeService";

export { validateMemeFile } from "./uploadValidation";
export {
  createAssetEvent,
  createDefaultUserUploadProfile,
  createInitialAssetDoc,
} from "./uploadDefaults";
export {
  finalizeUploadAsset,
  initializeUpload,
  submitAssetForReview,
  uploadAssetThroughBackend,
} from "./uploadPipelineService";
export {
  hasExceededUploadLimits,
  isEligibleForPublicPublish,
  isPublicAsset,
  isReviewableAssetStatus,
  isUploadSuspended,
} from "./uploadGuards";
export { extractMediaMetadata } from "./mediaMetadata";
export {
  getDefaultAsset,
  getPresetAssets,
  updateProfile,
  claimUsername,
  releaseUsername,
  validateUsername,
} from "./profileService";
export {
  getUserProfile,
  getUserByUsername,
  upsertUserProfile,
} from "./userService";

const dataSource = import.meta.env.VITE_DATA_SOURCE ?? "mock";

export const memeService: MemeService =
  dataSource === "mock" ? new MockMemeService() : new FirebaseMemeService();
