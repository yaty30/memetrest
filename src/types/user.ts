/** User roles for access control. */
export const USER_ROLES = ["user", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Account status — only active users can upload. */
export const USER_STATUSES = ["active", "suspended", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Asset moderation status — only approved assets show in public gallery. */
export const ASSET_STATUSES = ["pending", "approved", "rejected"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

/**
 * Firestore document shape: `users/{uid}`
 *
 * Created on first login. Firebase Auth handles identity;
 * this document stores app-specific profile and permission data.
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  username: string;
  uploadCount: number;
  createdAt: Date;
  lastLoginAt: Date;
}
