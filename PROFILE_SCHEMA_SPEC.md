# Memetrest Profile System — Final Schema Specification

> **Status**: Implementation-ready. All field names, types, enums, and shapes are final.
> This document supersedes the narrative design in `PROFILE_SYSTEM_DESIGN.md`.

---

## 1. Enum Definitions

All enums are defined as TypeScript `const` arrays with derived literal union types.

```typescript
// ── User roles ──
export const USER_ROLES = ["user", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
// Values: "user" | "moderator" | "admin"

// ── Account status ──
export const USER_STATUSES = ["active", "suspended", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
// Values: "active" | "suspended" | "banned"

// ── Asset moderation status ──
export const ASSET_STATUSES = ["pending", "approved", "rejected"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];
// Values: "pending" | "approved" | "rejected"

// ── Profile asset kind ──
export const PROFILE_ASSET_KINDS = ["avatar", "banner"] as const;
export type ProfileAssetKind = (typeof PROFILE_ASSET_KINDS)[number];
// Values: "avatar" | "banner"

// ── Profile asset ownership ──
export const PROFILE_ASSET_OWNERSHIPS = ["preset", "custom"] as const;
export type ProfileAssetOwnership = (typeof PROFILE_ASSET_OWNERSHIPS)[number];
// Values: "preset" | "custom"
```

---

## 2. `ProfileAssetRef` — Embedded Reference Shape

Stored as a **plain Firestore map** (not a subcollection) inside the user profile document.
Used for both `avatar` and `banner` fields.

```typescript
export interface ProfileAssetRef {
  assetId: string;                  // Doc ID in profileAssets collection
  url: string;                      // Public download URL (denormalized)
  kind: ProfileAssetKind;           // "avatar" | "banner"
  ownership: ProfileAssetOwnership; // "preset" | "custom"
}
```

### Example value (preset avatar)

```json
{
  "assetId": "preset-avatar-001",
  "url": "https://firebasestorage.googleapis.com/v0/b/memetrest-b57dc.firebasestorage.app/o/profile-assets%2Fpresets%2Favatars%2F1.jpeg?alt=media",
  "kind": "avatar",
  "ownership": "preset"
}
```

### Design decision: `kind` and `ownership` are redundant with the referenced asset

They are intentionally denormalized onto the ref so that:
- Firestore security rules can validate kind/ownership without a secondary `get()`.
- Client rendering logic doesn't need to fetch the `profileAssets` doc just to know the type.

---

## 3. `users/{uid}` — User Profile Document

**Collection**: `users`
**Document ID**: Firebase Auth UID (`request.auth.uid`)

```typescript
export interface UserProfile {
  // ── Identity (synced from Firebase Auth) ──────────────────
  uid: string;                      // Firebase Auth UID; equals doc ID
  email: string;                    // From Auth; synced every login
  authDisplayName: string;          // From Auth; synced every login
  authPhotoURL: string | null;      // From Auth (Google photo URL); synced every login

  // ── Editable profile fields ───────────────────────────────
  displayName: string;              // User-controlled; initialized from Auth on first login only
  username: string;                 // Unique lowercase handle; empty string until user sets it
  bio: string;                      // Free text; max 300 chars; empty string by default

  // ── Avatar & Banner ───────────────────────────────────────
  avatar: ProfileAssetRef;          // Current avatar; always a valid ProfileAssetRef
  banner: ProfileAssetRef;          // Current banner; always a valid ProfileAssetRef

  // ── Role & Status ─────────────────────────────────────────
  role: UserRole;                   // "user" | "moderator" | "admin"; default "user"
  status: UserStatus;               // "active" | "suspended" | "banned"; default "active"

  // ── Counters ──────────────────────────────────────────────
  uploadCount: number;              // Denormalized; incremented on meme approval
  savedCount: number;               // Denormalized; incremented/decremented on save/unsave

  // ── Timestamps ────────────────────────────────────────────
  createdAt: Date;                  // Server timestamp; set once on creation
  lastLoginAt: Date;                // Server timestamp; updated every sign-in
  profileUpdatedAt: Date;           // Server timestamp; updated on user-initiated profile edits
}
```

### Example document: Google sign-in user (first login)

**Path**: `users/abc123def456`

```json
{
  "uid": "abc123def456",
  "email": "jane@gmail.com",
  "authDisplayName": "Jane Doe",
  "authPhotoURL": "https://lh3.googleusercontent.com/a/abc123",

  "displayName": "Jane Doe",
  "username": "",
  "bio": "",

  "avatar": {
    "assetId": "preset-avatar-001",
    "url": "https://firebasestorage.googleapis.com/.../1.jpeg?alt=media",
    "kind": "avatar",
    "ownership": "preset"
  },
  "banner": {
    "assetId": "preset-banner-001",
    "url": "https://firebasestorage.googleapis.com/.../1.png?alt=media",
    "kind": "banner",
    "ownership": "preset"
  },

  "role": "user",
  "status": "active",

  "uploadCount": 0,
  "savedCount": 0,

  "createdAt": "2026-03-28T12:00:00Z",
  "lastLoginAt": "2026-03-28T12:00:00Z",
  "profileUpdatedAt": "2026-03-28T12:00:00Z"
}
```

### Example document: email/password user (first login)

**Path**: `users/xyz789ghi012`

```json
{
  "uid": "xyz789ghi012",
  "email": "bob@example.com",
  "authDisplayName": "",
  "authPhotoURL": null,

  "displayName": "",
  "username": "",
  "bio": "",

  "avatar": {
    "assetId": "preset-avatar-001",
    "url": "https://firebasestorage.googleapis.com/.../1.jpeg?alt=media",
    "kind": "avatar",
    "ownership": "preset"
  },
  "banner": {
    "assetId": "preset-banner-001",
    "url": "https://firebasestorage.googleapis.com/.../1.png?alt=media",
    "kind": "banner",
    "ownership": "preset"
  },

  "role": "user",
  "status": "active",

  "uploadCount": 0,
  "savedCount": 0,

  "createdAt": "2026-03-28T12:00:00Z",
  "lastLoginAt": "2026-03-28T12:00:00Z",
  "profileUpdatedAt": "2026-03-28T12:00:00Z"
}
```

### Example document: returning user after profile edits

**Path**: `users/abc123def456`

```json
{
  "uid": "abc123def456",
  "email": "jane@gmail.com",
  "authDisplayName": "Jane Doe",
  "authPhotoURL": "https://lh3.googleusercontent.com/a/abc123",

  "displayName": "Meme Queen Jane",
  "username": "meme.queen",
  "bio": "I collect the finest memes on the internet. 🐸",

  "avatar": {
    "assetId": "preset-avatar-003",
    "url": "https://firebasestorage.googleapis.com/.../3.jpeg?alt=media",
    "kind": "avatar",
    "ownership": "preset"
  },
  "banner": {
    "assetId": "preset-banner-002",
    "url": "https://firebasestorage.googleapis.com/.../2.png?alt=media",
    "kind": "banner",
    "ownership": "preset"
  },

  "role": "user",
  "status": "active",

  "uploadCount": 14,
  "savedCount": 87,

  "createdAt": "2026-03-28T12:00:00Z",
  "lastLoginAt": "2026-03-29T08:30:00Z",
  "profileUpdatedAt": "2026-03-28T18:45:00Z"
}
```

---

## 4. `profileAssets/{assetId}` — Profile Asset Document

**Collection**: `profileAssets`
**Document ID**: Auto-generated string (for future custom uploads) or deterministic string like `preset-avatar-001` (for presets).

```typescript
export interface ProfileAsset {
  id: string;                       // Document ID
  kind: ProfileAssetKind;           // "avatar" | "banner"
  ownership: ProfileAssetOwnership; // "preset" | "custom"

  // ── Display ───────────────────────────────────────────────
  label: string;                    // Human-readable name (e.g. "Cool Cat")
  url: string;                      // Public download URL
  storagePath: string;              // Firebase Storage path (for admin ops)

  // ── Dimensions ────────────────────────────────────────────
  width: number;                    // Intrinsic pixel width
  height: number;                   // Intrinsic pixel height

  // ── Organization ──────────────────────────────────────────
  category: string;                 // Grouping label (e.g. "animals", "abstract")
  tags: string[];                   // Freeform tags for filtering
  sortOrder: number;                // Display order within kind (lower = first)

  // ── Default flag ──────────────────────────────────────────
  isDefault: boolean;               // Assigned to new users; exactly one true per kind

  // ── Ownership (custom uploads only) ───────────────────────
  uploadedBy: string | null;        // UID of uploader; null for presets

  // ── Moderation ────────────────────────────────────────────
  status: AssetStatus;              // "approved" | "pending" | "rejected"

  // ── Timestamps ────────────────────────────────────────────
  createdAt: Date;                  // When the asset was added
  updatedAt: Date;                  // Last modification
}
```

### Example document: default preset avatar

**Path**: `profileAssets/preset-avatar-001`

```json
{
  "id": "preset-avatar-001",
  "kind": "avatar",
  "ownership": "preset",

  "label": "Default Avatar",
  "url": "https://firebasestorage.googleapis.com/v0/b/memetrest-b57dc.firebasestorage.app/o/profile-assets%2Fpresets%2Favatars%2F1.jpeg?alt=media",
  "storagePath": "profile-assets/presets/avatars/1.jpeg",

  "width": 512,
  "height": 512,

  "category": "default",
  "tags": [],
  "sortOrder": 0,

  "isDefault": true,

  "uploadedBy": null,
  "status": "approved",

  "createdAt": "2026-03-28T00:00:00Z",
  "updatedAt": "2026-03-28T00:00:00Z"
}
```

### Example document: non-default preset avatar

**Path**: `profileAssets/preset-avatar-003`

```json
{
  "id": "preset-avatar-003",
  "kind": "avatar",
  "ownership": "preset",

  "label": "Cool Cat",
  "url": "https://firebasestorage.googleapis.com/.../3.jpeg?alt=media",
  "storagePath": "profile-assets/presets/avatars/3.jpeg",

  "width": 400,
  "height": 400,

  "category": "animals",
  "tags": ["cat", "sunglasses"],
  "sortOrder": 2,

  "isDefault": false,

  "uploadedBy": null,
  "status": "approved",

  "createdAt": "2026-03-28T00:00:00Z",
  "updatedAt": "2026-03-28T00:00:00Z"
}
```

### Example document: default preset banner

**Path**: `profileAssets/preset-banner-001`

```json
{
  "id": "preset-banner-001",
  "kind": "banner",
  "ownership": "preset",

  "label": "Default Banner",
  "url": "https://firebasestorage.googleapis.com/.../1.png?alt=media",
  "storagePath": "profile-assets/presets/banners/1.png",

  "width": 1200,
  "height": 400,

  "category": "default",
  "tags": [],
  "sortOrder": 0,

  "isDefault": true,

  "uploadedBy": null,
  "status": "approved",

  "createdAt": "2026-03-28T00:00:00Z",
  "updatedAt": "2026-03-28T00:00:00Z"
}
```

### Example document: future custom avatar upload

**Path**: `profileAssets/Xk9mP2qR4wL7`  *(auto-generated ID)*

```json
{
  "id": "Xk9mP2qR4wL7",
  "kind": "avatar",
  "ownership": "custom",

  "label": "My selfie",
  "url": "https://firebasestorage.googleapis.com/.../1711612800000-selfie.jpeg?alt=media",
  "storagePath": "profile-assets/custom/abc123def456/avatars/1711612800000-selfie.jpeg",

  "width": 300,
  "height": 300,

  "category": "personal",
  "tags": [],
  "sortOrder": 0,

  "isDefault": false,

  "uploadedBy": "abc123def456",
  "status": "pending",

  "createdAt": "2026-03-28T14:00:00Z",
  "updatedAt": "2026-03-28T14:00:00Z"
}
```

---

## 5. `usernames/{username}` — Username Uniqueness Index

**Collection**: `usernames`
**Document ID**: Lowercase-normalized username string (the username **is** the doc ID).

```typescript
export interface UsernameDoc {
  uid: string;            // The UID that owns this username
  createdAt: Date;        // When this username was claimed
}
```

### Normalization rules

- Doc ID = `username.toLowerCase().trim()`
- All lookups and comparisons use the lowercased form
- The user profile `username` field also stores the lowercased form

### Example document

**Path**: `usernames/meme.queen`

```json
{
  "uid": "abc123def456",
  "createdAt": "2026-03-28T18:45:00Z"
}
```

---

## 6. Google Profile Photo Handling

### Decision: Google photos live in `authPhotoURL` only — never as the active `avatar`

| Field | Contains | Updated when |
|---|---|---|
| `authPhotoURL` | Raw Google profile photo URL (or `null` for email/password users) | Every login (synced from Firebase Auth) |
| `avatar` | A `ProfileAssetRef` pointing to a `profileAssets` document | User explicitly changes their avatar |

### Rationale

1. Google photo URLs are external, can expire, and are outside our control.
2. Keeping `avatar` as always a `ProfileAssetRef` means rendering logic has one code path — never a conditional "is this a Google URL or an asset ref?"
3. If we later want a "Use my Google photo" feature, we create a `ProfileAsset` with `ownership: "external"` (new enum value) that wraps the Google URL. The schema doesn't need to change — just the enum expands.

### What the client shows

- Profile avatar: always renders `avatar.url`.
- Google photo is preserved as metadata only — useful for a future "import my Google photo" prompt.

---

## 7. Default Asset Identification & Enforcement

### How defaults are marked

Exactly **one** `profileAssets` document per `kind` has `isDefault: true`:

```
profileAssets where kind == "avatar" && isDefault == true  →  1 document
profileAssets where kind == "banner" && isDefault == true  →  1 document
```

### How defaults are queried

```typescript
// Pseudocode for fetching the default avatar
const q = query(
  collection(db, "profileAssets"),
  where("kind", "==", "avatar"),
  where("isDefault", "==", true),
  limit(1)
);
```

### How defaults are assigned

During first-time profile creation:

1. Query for the default avatar and default banner (two parallel queries).
2. Build `ProfileAssetRef` from the returned documents.
3. Store the refs on the new user profile.

### Fallback if query fails

A hardcoded fallback config exists in the client:

```typescript
export const FALLBACK_AVATAR: ProfileAssetRef = {
  assetId: "preset-avatar-001",
  url: "/assets/profile/avatars/1.jpeg",
  kind: "avatar",
  ownership: "preset",
};

export const FALLBACK_BANNER: ProfileAssetRef = {
  assetId: "preset-banner-001",
  url: "/assets/profile/banners/1.png",
  kind: "banner",
  ownership: "preset",
};
```

After seeding, the `url` values are updated to actual Firebase Storage download URLs.

### Admin enforcement

- Only one document per kind should have `isDefault: true`.
- If a preset seeding script sets a new default, it must unset the previous one in the same batch write.
- No Firestore rule enforces the single-default invariant (too complex for rules) — it's an application-level responsibility.

---

## 8. Profile Stats: Stored Counters vs Derived

| Stat | Storage | Location | Mechanism |
|---|---|---|---|
| `uploadCount` | **Stored counter** | `users/{uid}.uploadCount` | Atomically incremented when a meme is approved |
| `savedCount` | **Stored counter** | `users/{uid}.savedCount` | Atomically incremented/decremented on save/unsave |
| Uploads list | **Derived query** | `memes where uploadedBy == uid` | Paginated query at read time |
| Saved items list | **Derived query** | Future `saves` collection | Paginated query at read time |
| `likesReceived` | **Deferred** | Not in schema yet | Add when likes collection is built |
| `followers` / `following` | **Deferred** | Not in schema yet | Add when social graph is built |
| `views` | **Deferred** | Not in schema yet | Add when analytics is built |

### Why counters for uploadCount/savedCount

- These two numbers are displayed on every profile view.
- A `COUNT` query on every profile load is expensive and slow.
- Counter drift risk is acceptable for MVP (client-side increments); Cloud Functions can harden this later.

### Why derived for lists

- Lists are paginated — you never need the full set in memory.
- Denormalizing upload/save lists onto the profile doc would hit the 1MB document size limit for active users.

---

## 9. Firebase Storage Path Structure

```
profile-assets/
├── presets/
│   ├── avatars/
│   │   ├── 1.jpeg          → preset-avatar-001
│   │   ├── 2.jpeg          → preset-avatar-002
│   │   ├── 3.jpeg          → preset-avatar-003
│   │   ├── 4.jpeg          → preset-avatar-004
│   │   └── 5.jpeg          → preset-avatar-005
│   └── banners/
│       ├── 1.png           → preset-banner-001
│       ├── 2.png           → preset-banner-002
│       └── 3.png           → preset-banner-003
└── custom/                  (future)
    └── {uid}/
        ├── avatars/
        │   └── {timestamp}-{filename}
        └── banners/
            └── {timestamp}-{filename}
```

### Mapping to existing local files

| Local file | Storage path | Firestore doc ID |
|---|---|---|
| `src/assets/profile/avatars/1.jpeg` | `profile-assets/presets/avatars/1.jpeg` | `preset-avatar-001` |
| `src/assets/profile/avatars/2.jpeg` | `profile-assets/presets/avatars/2.jpeg` | `preset-avatar-002` |
| `src/assets/profile/avatars/3.jpeg` | `profile-assets/presets/avatars/3.jpeg` | `preset-avatar-003` |
| `src/assets/profile/avatars/4.jpeg` | `profile-assets/presets/avatars/4.jpeg` | `preset-avatar-004` |
| `src/assets/profile/avatars/5.jpeg` | `profile-assets/presets/avatars/5.jpeg` | `preset-avatar-005` |
| `src/assets/profile/banners/1.png` | `profile-assets/presets/banners/1.png` | `preset-banner-001` |
| `src/assets/profile/banners/2.png` | `profile-assets/presets/banners/2.png` | `preset-banner-002` |
| `src/assets/profile/banners/3.png` | `profile-assets/presets/banners/3.png` | `preset-banner-003` |

---

## 10. Field-Level Specification Summary

### `users/{uid}` — all fields

| Field | Type | Default | Mutable by user | Mutable by admin | Notes |
|---|---|---|---|---|---|
| `uid` | `string` | Auth UID | No | No | Immutable; equals doc ID |
| `email` | `string` | Auth email | No | No | Synced from Auth every login |
| `authDisplayName` | `string` | Auth displayName or `""` | No | No | Synced from Auth every login |
| `authPhotoURL` | `string \| null` | Auth photoURL or `null` | No | No | Synced from Auth every login |
| `displayName` | `string` | Auth displayName or `""` | Yes | Yes | Set once from Auth on creation; user edits after |
| `username` | `string` | `""` | Yes | Yes | Empty until user claims one |
| `bio` | `string` | `""` | Yes | Yes | Max 300 chars |
| `avatar` | `ProfileAssetRef` | Default preset ref | Yes | Yes | Must reference an approved profileAsset |
| `banner` | `ProfileAssetRef` | Default preset ref | Yes | Yes | Must reference an approved profileAsset |
| `role` | `UserRole` | `"user"` | No | Yes | Admin-only change |
| `status` | `UserStatus` | `"active"` | No | Yes | Admin-only change |
| `uploadCount` | `number` | `0` | No | Yes | Increment on meme approval |
| `savedCount` | `number` | `0` | No | Yes | Increment/decrement on save/unsave |
| `createdAt` | `Timestamp` | `serverTimestamp()` | No | No | Immutable after creation |
| `lastLoginAt` | `Timestamp` | `serverTimestamp()` | No | No | Updated every login |
| `profileUpdatedAt` | `Timestamp` | `serverTimestamp()` | No | No | Updated on any user-initiated profile change |

### `profileAssets/{assetId}` — all fields

| Field | Type | Default (presets) | Notes |
|---|---|---|---|
| `id` | `string` | Deterministic ID | Matches doc ID |
| `kind` | `ProfileAssetKind` | — | `"avatar"` or `"banner"` |
| `ownership` | `ProfileAssetOwnership` | `"preset"` | `"preset"` or `"custom"` |
| `label` | `string` | Descriptive name | Human-readable |
| `url` | `string` | Storage download URL | Public URL |
| `storagePath` | `string` | Full storage path | For admin/deletion ops |
| `width` | `number` | Intrinsic width | Pixels |
| `height` | `number` | Intrinsic height | Pixels |
| `category` | `string` | `"default"` | Grouping label |
| `tags` | `string[]` | `[]` | Freeform |
| `sortOrder` | `number` | Sequential int | Lower = displayed first |
| `isDefault` | `boolean` | One per kind is `true` | Assigned to new users |
| `uploadedBy` | `string \| null` | `null` | UID for custom; null for presets |
| `status` | `AssetStatus` | `"approved"` | Presets always approved |
| `createdAt` | `Timestamp` | `serverTimestamp()` | Immutable |
| `updatedAt` | `Timestamp` | `serverTimestamp()` | Updated on any change |

### `usernames/{username}` — all fields

| Field | Type | Notes |
|---|---|---|
| *(doc ID)* | `string` | Lowercase-normalized username |
| `uid` | `string` | Owning user's Firebase Auth UID |
| `createdAt` | `Timestamp` | When the username was claimed |

---

## 11. Validation Constants

```typescript
// Username
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;
export const RESERVED_USERNAMES = [
  "admin", "moderator", "system", "memetrest", "null", "undefined",
  "settings", "profile", "edit", "api", "help", "support",
  "login", "signup", "signout", "home", "explore", "search",
  "upload", "discover", "trending", "saved", "collections",
] as const;

// Display name
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} '\-]{1,50}$/u;

// Bio
export const BIO_MAX_LENGTH = 300;
export const BIO_MAX_LINE_BREAKS = 5;
```
