/** User roles for access control. */
export const USER_ROLES = ["user", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Account status — only active users can upload. */
export const USER_STATUSES = ["active", "suspended", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** Asset moderation status — only approved assets show in public gallery. */
export const ASSET_STATUSES = ["pending", "approved", "rejected"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

/** Profile asset kind — avatar or banner. */
export const PROFILE_ASSET_KINDS = ["avatar", "banner"] as const;
export type ProfileAssetKind = (typeof PROFILE_ASSET_KINDS)[number];

/** Profile asset ownership — preset (admin-managed) or custom (user-uploaded). */
export const PROFILE_ASSET_OWNERSHIPS = ["preset", "custom"] as const;
export type ProfileAssetOwnership = (typeof PROFILE_ASSET_OWNERSHIPS)[number];

/**
 * Embedded reference to a profile asset (avatar or banner).
 * Stored as a plain Firestore map inside the user profile document.
 */
export interface ProfileAssetRef {
  assetId: string;
  url: string;
  kind: ProfileAssetKind;
  ownership: ProfileAssetOwnership;
}

/**
 * Firestore document shape: `users/{uid}`
 *
 * Created on first login. Firebase Auth handles identity;
 * this document stores app-specific profile and permission data.
 */
export interface UserProfile {
  // Identity (synced from Firebase Auth on each login)
  uid: string;
  email: string;
  authDisplayName: string;
  authPhotoURL: string | null;

  // Editable profile fields (user-controlled)
  displayName: string;
  username: string;
  bio: string;

  // Avatar & Banner
  avatar: ProfileAssetRef;
  banner: ProfileAssetRef;

  // Role & Status
  role: UserRole;
  status: UserStatus;

  // Counters
  uploadCount: number;
  savedCount: number;

  // Timestamps
  createdAt: Date;
  lastLoginAt: Date;
  profileUpdatedAt: Date;
}

/**
 * Firestore document shape: `profileAssets/{assetId}`
 *
 * Stores metadata for preset and (future) custom profile avatars & banners.
 */
export interface ProfileAsset {
  id: string;
  kind: ProfileAssetKind;
  ownership: ProfileAssetOwnership;
  label: string;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  category: string;
  tags: string[];
  sortOrder: number;
  isDefault: boolean;
  uploadedBy: string | null;
  status: AssetStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firestore document shape: `usernames/{username}`
 *
 * Reverse-lookup doc for username uniqueness enforcement.
 * Doc ID is the lowercase-normalized username.
 */
export interface UsernameDoc {
  uid: string;
  createdAt: Date;
}

// ── Validation constants ────────────────────────────────────────────────────

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;
export const RESERVED_USERNAMES = [
  "admin",
  "moderator",
  "system",
  "memetrest",
  "null",
  "undefined",
  "settings",
  "profile",
  "edit",
  "api",
  "help",
  "support",
  "login",
  "signup",
  "signout",
  "home",
  "explore",
  "search",
  "upload",
  "discover",
  "trending",
  "saved",
  "collections",
] as const;

export const DISPLAY_NAME_MAX_LENGTH = 50;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} '-]{1,50}$/u;

export const BIO_MAX_LENGTH = 300;
export const BIO_MAX_LINE_BREAKS = 5;

// ── Fallback asset refs (used when Firestore queries fail) ──────────────────

export const FALLBACK_AVATAR: ProfileAssetRef = {
  assetId: "preset-avatar-001",
  url: "/assets/profile/avatars/1.jpeg",
  kind: "avatar",
  ownership: "preset",
};

export const FALLBACK_BANNER: ProfileAssetRef = {
  assetId: "preset-banner-001",
  url: "/assets/profile/banners/1.jpeg",
  kind: "banner",
  ownership: "preset",
};
