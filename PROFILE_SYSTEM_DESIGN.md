# Memetrest Profile System — Data Model & Business Flow Design

> **Scope**: Firestore schema, Storage strategy, initialization flows, and business rules.
> No UI. No React components. No seeding. Backend/data foundation only.

---

## 1. Recommended Firestore Collections

| Collection | Doc ID | Purpose |
|---|---|---|
| `users/{uid}` | Firebase Auth UID | Main user profile |
| `usernames/{username}` | Lowercase username string | Username → UID reverse lookup (uniqueness) |
| `profileAssets/{assetId}` | Auto-generated | Preset and (future) custom avatars & banners |

### Why these three?

- **`users`** already exists — we extend it with new profile fields.
- **`usernames`** is a lightweight index collection. Firestore has no native unique constraint on a field, so a dedicated collection where the doc ID _is_ the username guarantees atomic uniqueness via `create` semantics (fails if doc exists).
- **`profileAssets`** stores metadata for both preset and (future) custom profile assets in one collection, distinguished by a `kind` field (`"avatar"` | `"banner"`) and an `ownership` field (`"preset"` | `"custom"`). One collection avoids query fragmentation and keeps the reference model uniform.

---

## 2. Schema for Each Collection

### 2.1 `users/{uid}` — User Profile Document

```typescript
interface UserProfile {
  // ── Identity (synced from Firebase Auth on each login) ──
  uid: string;                    // Firebase Auth UID (also the doc ID)
  email: string;                  // Firebase Auth email
  authDisplayName: string;        // Raw display name from Firebase Auth
  authPhotoURL: string | null;    // Raw Google profile photo URL from Auth

  // ── Editable profile fields (user-controlled) ──
  displayName: string;            // Memetrest display name (initialized from Auth)
  username: string;               // Unique handle, lowercase, e.g. "dankmemer42"
  bio: string;                    // Free-text bio, max 300 chars

  // ── Avatar & Banner references ──
  avatar: ProfileAssetRef;        // Current avatar
  banner: ProfileAssetRef;        // Current banner

  // ── Role / Status ──
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended" | "banned";

  // ── Counters (denormalized for fast reads) ──
  uploadCount: number;
  savedCount: number;

  // ── Timestamps ──
  createdAt: Timestamp;           // Firestore server timestamp, set once
  lastLoginAt: Timestamp;         // Updated on every sign-in
  profileUpdatedAt: Timestamp;    // Updated when user edits profile fields
}

/**
 * Uniform reference to any profile asset — preset or custom.
 * Stored as a plain object (map) inside the user document.
 */
interface ProfileAssetRef {
  assetId: string;                // Doc ID in profileAssets collection
  url: string;                    // Resolved download URL (denormalized for fast reads)
  kind: "avatar" | "banner";     // Redundant but useful for validation
  ownership: "preset" | "custom"; // Distinguishes preset vs user-uploaded
}
```

#### Field origin table

| Field | Source |
|---|---|
| `uid`, `email`, `authDisplayName`, `authPhotoURL` | Firebase Auth (synced every login) |
| `displayName`, `username`, `bio`, `avatar`, `banner` | Firestore profile doc (user-editable) |
| `role`, `status` | Firestore profile doc (admin-editable only) |
| `uploadCount`, `savedCount` | Firestore profile doc (denormalized counters) |
| `createdAt`, `lastLoginAt`, `profileUpdatedAt` | Firestore profile doc (server timestamps) |
| Upload list, saved list, collections | Derived via queries against `memes` and future `saves`/`collections` collections |
| Followers, likes received, views | Derived or future counters (see §6) |

#### Key changes from current schema

The existing `UserProfile` has `displayName` and `photoURL` synced from Auth on every login, which silently overwrites any user edits. The new design:

1. Preserves Auth-sourced values in `authDisplayName` / `authPhotoURL` (for reference / fallback).
2. Gives the user their own `displayName` that is only Auth-initialized on first creation, never overwritten by Auth again.
3. Replaces the flat `photoURL` string with a structured `avatar: ProfileAssetRef` that works uniformly for presets and future uploads.

---

### 2.2 `profileAssets/{assetId}` — Preset & Custom Profile Assets

```typescript
interface ProfileAsset {
  id: string;                     // Auto-generated doc ID
  kind: "avatar" | "banner";     // Asset type
  ownership: "preset" | "custom"; // Who owns it

  // ── Display ──
  label: string;                  // Human-readable name, e.g. "Sunset Mountain"
  url: string;                    // Public download URL
  storagePath: string;            // Firebase Storage path (for admin ops / deletion)

  // ── Dimensions ──
  width: number;                  // Intrinsic pixel width
  height: number;                 // Intrinsic pixel height

  // ── Organization ──
  category: string;               // Grouping tag, e.g. "animals", "abstract", "memes"
  tags: string[];                 // Freeform tags for future filtering/search
  sortOrder: number;              // Manual ordering within category (presets only)

  // ── Defaults ──
  isDefault: boolean;             // If true, assigned to new users (one per kind)

  // ── Ownership (custom uploads only — null/empty for presets) ──
  uploadedBy: string | null;      // UID of the uploader (null for presets)

  // ── Moderation (relevant for custom uploads) ──
  status: "approved" | "pending" | "rejected";  // Presets are always "approved"

  // ── Timestamps ──
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Design notes

- **One collection for both presets and custom uploads**: The `ownership` field distinguishes them. This keeps the `ProfileAssetRef` on user profiles generic — it always points at `profileAssets/{assetId}` regardless of type.
- **`isDefault: true`**: Exactly one avatar asset and one banner asset should be marked as default. Queried at user creation time. If multiple are marked, the system picks the first one by `sortOrder`.
- **`category` + `tags`**: Optional for MVP but cheap to include now. Useful for organizing a picker UI later (e.g. "Animals" tab, "Abstract" tab).
- **`sortOrder`**: Integer for admin-controlled display ordering in the preset picker.
- **Presets are always `status: "approved"`**. Custom uploads start as `"pending"` and go through moderation.

---

### 2.3 `usernames/{username}` — Username Uniqueness Index

```typescript
interface UsernameDoc {
  uid: string;          // The UID that owns this username
  createdAt: Timestamp; // When the username was claimed
}
```

- Doc ID = the lowercased, normalized username.
- To claim a username: create this doc (atomic, fails if exists).
- To release: delete the old doc, then create the new one — done in a Firestore batch/transaction.

---

## 3. Firebase Storage Path Design

```
profile-assets/
├── presets/
│   ├── avatars/
│   │   ├── avatar-001.jpeg
│   │   ├── avatar-002.jpeg
│   │   └── ...
│   └── banners/
│       ├── banner-001.png
│       ├── banner-002.png
│       └── ...
└── custom/
    └── {uid}/
        ├── avatars/
        │   └── {timestamp}-{filename}
        └── banners/
            └── {timestamp}-{filename}
```

| Path pattern | Purpose |
|---|---|
| `profile-assets/presets/avatars/{filename}` | Admin-uploaded preset avatars |
| `profile-assets/presets/banners/{filename}` | Admin-uploaded preset banners |
| `profile-assets/custom/{uid}/avatars/{timestamp}-{filename}` | Future user-uploaded avatar |
| `profile-assets/custom/{uid}/banners/{timestamp}-{filename}` | Future user-uploaded banner |

#### Why this structure?

- **`profile-assets/` prefix** separates profile media from meme uploads (`uploads/`).
- **`presets/` vs `custom/`** makes ownership immediately obvious at the storage level.
- **`{uid}` scoping** under `custom/` enables per-user storage rules.
- **Timestamp prefix** on custom uploads prevents filename collisions.

#### Storage rules addition (future)

```
match /profile-assets/presets/{allPaths=**} {
  allow read: if true;
  allow write: if false;  // Admin SDK only — no client writes
}

match /profile-assets/custom/{uid}/{allPaths=**} {
  allow read: if true;
  allow write: if request.auth != null
    && request.auth.uid == uid
    && request.resource.size < 5 * 1024 * 1024
    && request.resource.contentType.matches('image/(jpeg|png|webp|gif)');
}
```

For MVP, only the presets rules are needed. Preset assets are uploaded via Admin SDK or Firebase Console — no client write path required.

---

## 4. First-Time User Creation Flow

### 4.1 Google Sign-In (new user)

```
1. User clicks "Sign in with Google"
2. Firebase Auth completes OAuth → returns FirebaseUser
      { uid, email, displayName: "Jane Doe", photoURL: "https://lh3..." }

3. Client calls upsertUserProfile(firebaseUser)
4. upsertUserProfile checks: doc users/{uid} exists?
      → NO (first time)

5. Query for default profile assets:
      a. query profileAssets where kind == "avatar" && isDefault == true → defaultAvatar
      b. query profileAssets where kind == "banner" && isDefault == true → defaultBanner
      (Both queries can run in parallel)

6. Create Firestore document users/{uid}:
      {
        uid:              firebaseUser.uid,
        email:            firebaseUser.email,
        authDisplayName:  firebaseUser.displayName,    // "Jane Doe"
        authPhotoURL:     firebaseUser.photoURL,       // Google photo URL
        displayName:      firebaseUser.displayName,    // initial value, user can change later
        username:         "",                           // empty — user must set later
        bio:              "",
        avatar:           {
          assetId:   defaultAvatar.id,
          url:       defaultAvatar.url,
          kind:      "avatar",
          ownership: "preset"
        },
        banner:           {
          assetId:   defaultBanner.id,
          url:       defaultBanner.url,
          kind:      "banner",
          ownership: "preset"
        },
        role:             "user",
        status:           "active",
        uploadCount:      0,
        savedCount:       0,
        createdAt:        serverTimestamp(),
        lastLoginAt:      serverTimestamp(),
        profileUpdatedAt: serverTimestamp(),
      }

7. Return the new UserProfile to AuthProvider → context is set
```

**Google photo handling**: The raw Google `photoURL` is stored in `authPhotoURL` as a reference, but the profile `avatar` field points at a preset asset by default. The Google photo is _not_ imported into the profile asset system — it's just preserved as metadata. Rationale:
- Google photo URLs can change or expire.
- Normalizing everything through `ProfileAssetRef` keeps rendering logic uniform.
- If we later want a "Use my Google photo" option, we can add a special `ownership: "external"` variant.

### 4.2 Email/Password Sign-Up (new user)

```
1. User registers with email + password
2. Firebase Auth creates account → returns FirebaseUser
      { uid, email, displayName: null, photoURL: null }

3. Same flow as above, except:
      - authDisplayName = ""
      - authPhotoURL = null
      - displayName = "" (or extracted from email prefix as hint)
      - avatar = defaultAvatar preset
      - banner = defaultBanner preset

4. User is prompted to set displayName and username (future UI concern)
```

### 4.3 Partial failure handling

| Failure point | Impact | Recovery |
|---|---|---|
| Default asset query fails | Cannot build complete profile doc | Catch error, retry once. If still failing, create profile doc with a hardcoded fallback asset reference (a known preset ID + URL baked into client config). Log warning. |
| Firestore `setDoc` fails | Profile not created | AuthProvider catches error, sets `userProfile = null`. User sees signed-in state but broken profile. Next page load retries `upsertUserProfile`. |
| Auth succeeds but Firestore is down | Auth exists, no profile | The returning-user flow (§5) handles this — if profile doc is missing, it re-runs the creation logic. |

### 4.4 Minimal day-one fields

These fields MUST exist on every profile document from creation:

```
uid, email, displayName, avatar, banner, role, status, createdAt, lastLoginAt
```

Fields that can be empty/zero on day one: `username`, `bio`, `savedCount`, `uploadCount`.

---

## 5. Returning User Login Flow

```
1. App loads → AuthProvider mounts
2. onAuthStateChanged fires with FirebaseUser (or null)

3. If FirebaseUser exists:
   a. Call upsertUserProfile(firebaseUser)
   b. upsertUserProfile checks: doc users/{uid} exists?

      → YES (returning user):
         - Update:  lastLoginAt = serverTimestamp()
         - Sync:    email, authDisplayName, authPhotoURL (from Auth)
         - DO NOT overwrite: displayName, username, bio, avatar, banner
         - Return merged UserProfile

      → NO (orphaned Auth — profile doc missing):
         - Treat as first-time user: run full creation flow (§4)
         - This handles edge cases where Auth exists but Firestore
           doc was deleted, failed to create, or was wiped

4. If FirebaseUser is null:
   - User is signed out
   - Set userProfile = null in context
```

**Key principle**: Auth fields (`authDisplayName`, `authPhotoURL`) are always synced from the identity provider. User-editable fields (`displayName`, `avatar`, etc.) are never overwritten by Auth data after initial creation.

---

## 6. Stats Strategy

### Recommended approach: **Hybrid (denormalized counters + derived queries)**

| Stat | Strategy | Stored on | Rationale |
|---|---|---|---|
| `uploadCount` | **Denormalized counter** | `users/{uid}` | Incremented atomically when a meme is approved. Cheap to read, avoids count query on every profile view. |
| `savedCount` | **Denormalized counter** | `users/{uid}` | Incremented/decremented when user saves/unsaves. Same rationale. |
| Uploads list | **Derived query** | Query `memes` where `uploadedBy == uid` | Data already exists. No duplication needed. Paginated. |
| Saved items list | **Derived query** | Query future `saves` subcollection or collection | Paginated list, not worth denormalizing. |
| `likesReceived` | **Deferred** | Not stored yet | Requires a `likes` collection (not yet built). When built, maintain a counter on `users/{uid}` updated via Cloud Function or transaction. |
| `followers` / `following` | **Deferred** | Not stored yet | Social graph is a future feature. When built, use counter fields + a `follows` collection. |
| `views` | **Deferred** | Not stored yet | Requires analytics infrastructure. Not profile-level MVP. |

### Tradeoffs

| Approach | Pros | Cons |
|---|---|---|
| **Pure counters on profile** | O(1) reads, fast profile loads | Must be kept in sync; risk of drift without Cloud Functions |
| **Pure derived queries** | Always accurate | Expensive `COUNT` queries on every profile view; Firestore charges per-doc-read |
| **Hybrid (recommended)** | Fast reads for high-frequency stats, queries for lists | Slightly more write complexity for counters |

### Counter maintenance

- **MVP**: Increment/decrement counters in the same client transaction that creates/deletes the underlying resource (e.g., when a meme is approved, increment `uploadCount`).
- **Production hardening**: Move counter updates to Cloud Functions triggered by Firestore writes. This prevents client-side drift and handles edge cases (e.g., meme deletion by admin should decrement uploader's count).

---

## 7. Validation Rules

### 7.1 Username

| Rule | Value |
|---|---|
| Required | No (empty on creation, user sets it later) |
| Min length (when set) | 3 characters |
| Max length | 24 characters |
| Allowed characters | `a-z`, `0-9`, `_`, `.` (lowercase only) |
| Pattern | `/^[a-z0-9_.]{3,24}$/` |
| Uniqueness | Enforced via `usernames/{username}` doc — atomic create |
| Reserved words | Block list: `admin`, `moderator`, `system`, `memetrest`, `null`, `undefined`, `settings`, `profile`, `edit`, `api`, `help`, `support` (and URL-sensitive slugs) |
| Change frequency | Allow changes, but consider a cooldown (e.g., once per 30 days) enforced via `profileUpdatedAt` or a dedicated `usernameChangedAt` field |
| Normalization | Always store and compare lowercase. Strip leading/trailing whitespace. |

#### Username claim flow (pseudocode)

```typescript
async function claimUsername(uid: string, newUsername: string): Promise<void> {
  const normalized = newUsername.toLowerCase().trim();
  validate(normalized);  // regex, length, reserved-word check

  await runTransaction(async (txn) => {
    const currentProfile = await txn.get(doc(db, "users", uid));
    const oldUsername = currentProfile.data().username;

    // Check new username is free
    const newRef = doc(db, "usernames", normalized);
    const existing = await txn.get(newRef);
    if (existing.exists()) throw new Error("Username taken");

    // Release old username if any
    if (oldUsername) {
      txn.delete(doc(db, "usernames", oldUsername));
    }

    // Claim new username
    txn.set(newRef, { uid, createdAt: serverTimestamp() });

    // Update profile
    txn.update(doc(db, "users", uid), {
      username: normalized,
      profileUpdatedAt: serverTimestamp(),
    });
  });
}
```

### 7.2 Display Name

| Rule | Value |
|---|---|
| Required | Yes (non-empty after profile setup) |
| Max length | 50 characters |
| Allowed characters | Unicode letters, numbers, spaces, hyphens, apostrophes |
| Pattern | `/^[\p{L}\p{N} '\-]{1,50}$/u` |
| Uniqueness | Not required (display names are not unique identifiers) |
| Trimming | Strip leading/trailing whitespace; collapse internal multiple spaces |

### 7.3 Bio

| Rule | Value |
|---|---|
| Required | No |
| Max length | 300 characters |
| Allowed content | Free text, no HTML. Newlines allowed (max 5 line breaks). |
| Sanitization | Strip HTML tags. Trim whitespace. |

### 7.4 Avatar / Banner Assignment

| Rule | Value |
|---|---|
| Must reference valid `profileAssets` doc | Yes — validate assetId exists |
| Asset `kind` must match | Avatar ref must point to `kind: "avatar"`, banner to `kind: "banner"` |
| Asset `status` must be `"approved"` | Cannot reference pending/rejected assets |
| Custom asset ownership | If `ownership: "custom"`, the `uploadedBy` field must match the requesting user's UID |

#### Firestore rules enforcement (additions for profile asset assignment)

```
// In users/{uid} update rule, validate avatar/banner references:
allow update: if isOwner(uid)
  && request.resource.data.role == resource.data.role
  && request.resource.data.status == resource.data.status
  && (
    request.resource.data.avatar.assetId == resource.data.avatar.assetId
    || exists(/databases/$(database)/documents/profileAssets/$(request.resource.data.avatar.assetId))
  )
  && (
    request.resource.data.banner.assetId == resource.data.banner.assetId
    || exists(/databases/$(database)/documents/profileAssets/$(request.resource.data.banner.assetId))
  );
```

---

## 8. Security / Permission Model

### 8.1 Roles

| Role | Description |
|---|---|
| `user` | Default. Can edit own profile, change preset avatar/banner. |
| `moderator` | Can review custom uploads (future), view flagged profiles. |
| `admin` | Full access: change any user's role/status, manage presets, delete profiles. |

### 8.2 Account Status

| Status | Effect |
|---|---|
| `active` | Full access to all profile operations. |
| `suspended` | Read-only. Cannot edit profile, change avatar/banner, or upload. Can still sign in and view content. |
| `banned` | Same as suspended. Profile may be hidden from public views (future). |

### 8.3 Permission Matrix

| Operation | `active` user | `suspended` user | `banned` user | `moderator` | `admin` |
|---|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View others' profiles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit displayName / bio | ✅ | ❌ | ❌ | ✅ (own) | ✅ (any) |
| Change username | ✅ | ❌ | ❌ | ✅ (own) | ✅ (any) |
| Change preset avatar/banner | ✅ | ❌ | ❌ | ✅ (own) | ✅ (any) |
| Upload custom avatar/banner (future) | ✅ | ❌ | ❌ | ✅ (own) | ✅ (any) |
| Change any user's role/status | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage preset assets | ❌ | ❌ | ❌ | ❌ | ✅ |
| Moderate custom uploads (future) | ❌ | ❌ | ❌ | ✅ | ✅ |

### 8.4 Firestore rules strategy

- **Profile reads**: Public (anyone, even unauthenticated) — for profile pages.
- **Profile self-edits**: Owner + `status == "active"` + cannot change `role`/`status`.
- **Admin overrides**: Admin can update any field on any profile.
- **`profileAssets` reads**: Public (needed for asset pickers and rendering).
- **`profileAssets` writes**: Admin only (presets are managed server-side). Future custom uploads would allow owner to create assets with `ownership: "custom"` and `uploadedBy == request.auth.uid`.
- **`usernames` creates**: Authenticated users only (done inside transactions from client, but validated by rules).
- **`usernames` deletes**: Only the UID that owns the username doc, or admin.

---

## 9. Implementation Recommendations

### 9.1 Migration from current schema

The existing `UserProfile` type and `upsertUserProfile` function need these changes:

1. **Rename `photoURL` → `authPhotoURL`** and add `authDisplayName`.
2. **Stop overwriting `displayName`** on returning-user login — only sync `authDisplayName`.
3. **Add `avatar` and `banner` as `ProfileAssetRef` map fields**.
4. **Add `bio`, `savedCount`, `profileUpdatedAt` fields**.
5. **Add `username` to firestore rules** awareness (already exists but is empty string).
6. **Seed the `profileAssets` collection** with the 5 existing avatars and 3 existing banners from `src/assets/profile/`.
7. **Create the `usernames` collection** (initially empty).

### 9.2 Seeding preset assets

The existing local files should be:

1. Uploaded to Firebase Storage at `profile-assets/presets/avatars/` and `profile-assets/presets/banners/`.
2. Registered in Firestore `profileAssets` collection with intrinsic dimensions, labels, and `isDefault` flags.
3. One avatar and one banner marked `isDefault: true`.

### 9.3 Default asset config fallback

To handle the edge case where preset asset queries fail during profile creation, embed a hardcoded fallback in the client config:

```typescript
const FALLBACK_AVATAR: ProfileAssetRef = {
  assetId: "default-avatar-001",
  url: "/assets/profile/avatars/1.jpeg",  // local fallback
  kind: "avatar",
  ownership: "preset",
};

const FALLBACK_BANNER: ProfileAssetRef = {
  assetId: "default-banner-001",
  url: "/assets/profile/banners/1.png",   // local fallback
  kind: "banner",
  ownership: "preset",
};
```

After seeding, replace URLs with actual Firebase Storage download URLs.

### 9.4 Type definitions

Create a new `src/types/profile.ts` file to house:

- `ProfileAssetRef` interface
- `ProfileAsset` interface
- `ProfileAssetKind` type (`"avatar" | "banner"`)
- `ProfileAssetOwnership` type (`"preset" | "custom"`)
- Updated `UserProfile` interface (or extend the existing one)
- Username validation constants and regex

### 9.5 Service layer

Create `src/services/profileService.ts` with:

- `getProfileAssets(kind, ownership?)` — fetch available presets
- `getDefaultAsset(kind)` — fetch the default asset for avatars or banners
- `updateProfile(uid, fields)` — update editable profile fields
- `claimUsername(uid, username)` — transactional username claim
- `releaseUsername(uid)` — release current username

Keep `userService.ts` for `upsertUserProfile` / `getUserProfile` (auth lifecycle), and use `profileService.ts` for user-initiated profile edits.

### 9.6 Query indexes

Add composite indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "profileAssets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "kind", "order": "ASCENDING" },
        { "fieldPath": "ownership", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "sortOrder", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "profileAssets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "kind", "order": "ASCENDING" },
        { "fieldPath": "isDefault", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 10. Assumptions and Open Questions

### Assumptions

1. **Firebase Auth is the sole identity provider.** No custom auth tokens or third-party SSO beyond Google.
2. **Preset assets are managed by admins** (via scripts, Admin SDK, or Firebase Console) — not through client UI.
3. **Profile documents are public-readable.** No privacy toggle is needed for MVP.
4. **Username is optional at creation** — users are prompted to set one later but can use the platform without it.
5. **Google profile photos are NOT imported into the asset model.** They're preserved as `authPhotoURL` for reference only. The platform avatar is always a `ProfileAssetRef`.
6. **No email verification requirement** for MVP — but `email` is synced from Auth and could be used for verification flows later.
7. **Client-side counter maintenance is acceptable for MVP.** Cloud Functions are recommended for production but not required initially.
8. **The 5 avatar JPEGs and 3 banner PNGs** in `src/assets/profile/` are the initial preset assets.

### Open Questions

| # | Question | Default / Recommendation |
|---|---|---|
| 1 | Should we support "Use my Google photo" as an avatar option, or only presets? | **Presets only for MVP.** Can add an `ownership: "external"` variant later. |
| 2 | Should username be required before a user can upload memes? | **Recommended yes** — gives every uploader a public identity. |
| 3 | Should profile edits (bio, displayName) go through moderation? | **No for MVP.** Add content filtering later if abuse becomes an issue. |
| 4 | Should we store `followerCount` / `followingCount` now even if the social graph isn't built? | **No.** Add these fields when the `follows` collection is built. Avoid empty counters that suggest non-existent features. |
| 5 | Should preset asset URLs be denormalized onto the user profile, or resolved at read time? | **Denormalized** (stored in `ProfileAssetRef.url`). Preset URLs never change. If an admin replaces a preset, a migration script updates affected profiles. |
| 6 | Maximum number of username changes? | **Recommend once per 30 days.** Track with a `usernameChangedAt` timestamp. Enforce in application logic, not Firestore rules (too complex). |
| 7 | Should suspended/banned users' profiles be hidden from public view? | **Not for MVP.** Keep profiles readable. Add a visibility flag later if needed. |
| 8 | Do we need a `profileAssets` subcollection under each user for their custom uploads? | **No.** Use the top-level `profileAssets` collection with `uploadedBy` field. Queries by ownership are simple: `where("uploadedBy", "==", uid)`. |

---

## Summary

This design establishes a clean, extensible data foundation:

- **Uniform asset reference model** (`ProfileAssetRef`) that works for presets today and custom uploads tomorrow — no schema migration needed.
- **Atomic username uniqueness** via a dedicated `usernames` collection.
- **Auth fields preserved but never overwriting user edits** — `authDisplayName`/`authPhotoURL` vs `displayName`/`avatar`.
- **Hybrid stats** — fast counter reads for the common case, derived queries for lists.
- **Clear storage paths** — ownership and asset type visible in the path structure.
- **Minimal Firestore rules extension** — builds on the existing role/status model.
