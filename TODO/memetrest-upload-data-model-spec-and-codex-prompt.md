# Memetrest Upload Data Model Spec + Codex Implementation Prompt

## Purpose

This document defines the **upload data model** for Memetrest and provides a **Codex prompt** to implement the schema setup in the codebase.

The goal is to support:

- authenticated-user uploads only
- rate-limited upload eligibility
- upload and publish as separate lifecycle stages
- private intake / quarantine before publication
- validation, processing, and moderation states
- clear public visibility rules
- future support for review tooling and contributor trust tiers

---

# Part 1 — Upload data model spec

## 1. Product principles

### 1.1 Upload eligibility
A user may upload only if all of the following are true:

- authenticated
- account is active
- not upload-suspended
- within rate limits
- email verification passes, if the product enables that rule

### 1.2 Core rule
**Upload is not publish.**

A successful upload means the system has accepted a file submission. It does **not** mean the asset is public.

### 1.3 Public visibility rule
Only assets that satisfy both conditions below are considered publicly visible:

- `status = 'published'`
- `visibility = 'public'`

All other states are private to the uploader and moderators/admins as permitted by security rules.

### 1.4 Design objective
The data model should support these future capabilities without breaking schema consistency:

- moderation queue
- rejection reasons
- trust-tier progression
- upload suspension / strikes
- duplicate detection
- derivative generation
- private-to-public publish transition
- analytics and audit history

---

## 2. Firestore collections

Use the following collections:

```txt
users/{userId}
assets/{assetId}
assets/{assetId}/events/{eventId}
```

Optional future collections, but not required for the first implementation:

```txt
moderationQueue/{assetId}
rateLimits/{userId}
```

For the first pass, keep upload quotas and moderation health inside the main `users/{userId}` document.

---

## 3. User document additions

The user document should include upload capability, trust, limits, usage counters, and moderation health.

### 3.1 TypeScript types

```ts
export type UserRole =
  | 'user'
  | 'moderator'
  | 'admin';

export type UploadTrustTier =
  | 'basic'
  | 'trusted'
  | 'restricted';

export interface UserUploadLimits {
  dailyUploadLimit: number;
  weeklyUploadLimit: number;
  monthlyUploadLimit?: number | null;
  burstLimitPerHour?: number | null;
}

export interface UserUploadUsage {
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  lastUploadAt?: number | null;
  dailyWindowStart: number;
  weeklyWindowStart: number;
  monthlyWindowStart: number;
}

export interface UserModerationHealth {
  approvalCount: number;
  rejectionCount: number;
  removedAfterPublishCount: number;
  strikeCount: number;
  suspendedUntil?: number | null;
  lastRejectedAt?: number | null;
  lastStrikeAt?: number | null;
}

export interface UserUploadProfile {
  canUpload: boolean;
  trustTier: UploadTrustTier;
  limits: UserUploadLimits;
  usage: UserUploadUsage;
  moderation: UserModerationHealth;
}

export interface UserDoc {
  id: string;
  role: UserRole;

  displayName: string;
  email?: string | null;
  emailVerified?: boolean;

  uploadProfile: UserUploadProfile;

  createdAt: number;
  updatedAt: number;
}
```

### 3.2 Notes

- `role` controls moderator/admin permissions.
- `trustTier` supports future progression and differentiated rate limits.
- `usage` stores counters for cheap rate-limit checks.
- `suspendedUntil` blocks uploads without deleting the user.
- `canUpload` provides a fast high-level gate.

### 3.3 Default upload profile recommendation

For newly registered users:

```ts
{
  canUpload: true,
  trustTier: 'basic',
  limits: {
    dailyUploadLimit: 3,
    weeklyUploadLimit: 10,
    monthlyUploadLimit: 30,
    burstLimitPerHour: 2,
  },
  usage: {
    dailyCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    lastUploadAt: null,
    dailyWindowStart: 0,
    weeklyWindowStart: 0,
    monthlyWindowStart: 0,
  },
  moderation: {
    approvalCount: 0,
    rejectionCount: 0,
    removedAfterPublishCount: 0,
    strikeCount: 0,
    suspendedUntil: null,
    lastRejectedAt: null,
    lastStrikeAt: null,
  }
}
```

---

## 4. Asset document

The asset document is the source of truth for uploaded content and its lifecycle.

### 4.1 Lifecycle overview

Recommended state flow:

```txt
uploaded
  ↓
processing
  ↓
pending_review
  ↓
published
```

Possible alternate branches:

```txt
processing -> rejected
pending_review -> rejected
published -> removed
published -> archived
```

### 4.2 TypeScript types

```ts
export type AssetKind =
  | 'image'
  | 'gif';

export type AssetStatus =
  | 'uploaded'
  | 'processing'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'removed'
  | 'archived';

export type AssetVisibility =
  | 'private'
  | 'unlisted'
  | 'public';

export type ProcessingState =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export type ModerationScanState =
  | 'not_requested'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed';

export type ModerationScanResult =
  | 'unknown'
  | 'clean'
  | 'borderline'
  | 'explicit';

export type ModerationDecision =
  | 'pending'
  | 'approved'
  | 'rejected';

export type RejectionReasonCode =
  | 'policy_explicit'
  | 'policy_violence'
  | 'policy_hate'
  | 'spam'
  | 'duplicate'
  | 'low_quality'
  | 'invalid_file'
  | 'copyright'
  | 'other';

export interface AssetStoragePaths {
  originalPath: string;
  previewPath?: string | null;
  thumbnailPath?: string | null;
}

export interface AssetUrls {
  originalUrl?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface AssetDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface AssetSourceInfo {
  sourceType: 'upload' | 'external';
  sourceUrl?: string | null;
  attributionText?: string | null;
}

export interface AssetModeration {
  userSensitiveFlag?: boolean;
  scanState: ModerationScanState;
  scanResult: ModerationScanResult;
  finalDecision: ModerationDecision;
  rejectionReasonCode?: RejectionReasonCode | null;
  rejectionReasonText?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: number | null;
}

export interface AssetProcessing {
  metadataState: ProcessingState;
  derivativeState: ProcessingState;
  hashState: ProcessingState;
  failedReason?: string | null;
  uploadCompletedAt?: number | null;
  metadataExtractedAt?: number | null;
  derivativesGeneratedAt?: number | null;
}

export interface AssetMetrics {
  views: number;
  favorites: number;
  shares: number;
  comments: number;
}

export interface AssetDoc {
  id: string;

  ownerId: string;
  ownerRoleAtUpload?: UserRole;

  kind: AssetKind;
  title: string;
  description?: string | null;
  tags: string[];

  status: AssetStatus;
  visibility: AssetVisibility;

  mimeType: string;
  fileSize: number;
  isAnimated: boolean;
  dimensions: AssetDimensions;

  storage: AssetStoragePaths;
  urls?: AssetUrls;

  source: AssetSourceInfo;

  moderation: AssetModeration;
  processing: AssetProcessing;
  metrics: AssetMetrics;

  fileHash?: string | null;

  createdAt: number;
  updatedAt: number;
  publishedAt?: number | null;
  removedAt?: number | null;
  archivedAt?: number | null;
}
```

---

## 5. Required field rules

### 5.1 Required at initial asset creation
When the upload has completed and the first asset document is created, the document must include:

- `id`
- `ownerId`
- `kind`
- `title`
- `tags`
- `status`
- `visibility`
- `mimeType`
- `fileSize`
- `isAnimated`
- `dimensions.width`
- `dimensions.height`
- `dimensions.aspectRatio`
- `storage.originalPath`
- `source.sourceType`
- `moderation.scanState`
- `moderation.scanResult`
- `moderation.finalDecision`
- `processing.metadataState`
- `processing.derivativeState`
- `processing.hashState`
- `metrics.views`
- `metrics.favorites`
- `metrics.shares`
- `metrics.comments`
- `createdAt`
- `updatedAt`

### 5.2 Required when published
When an asset becomes public:

- `status` must be `published`
- `visibility` should normally be `public`
- `moderation.finalDecision` must be `approved`
- `publishedAt` must be set
- public delivery URLs may be set if the product uses URL fields

### 5.3 Required when rejected
When an asset is rejected:

- `status = 'rejected'`
- `moderation.finalDecision = 'rejected'`
- `moderation.reviewedAt` should be set
- `moderation.reviewedBy` should be set for manual review
- `moderation.rejectionReasonCode` should be set when known

---

## 6. Asset default values

Recommended defaults when a user upload completes and the system creates the asset document:

```ts
{
  status: 'uploaded',
  visibility: 'private',
  moderation: {
    userSensitiveFlag: false,
    scanState: 'not_requested',
    scanResult: 'unknown',
    finalDecision: 'pending',
    rejectionReasonCode: null,
    rejectionReasonText: null,
    reviewedBy: null,
    reviewedAt: null,
  },
  processing: {
    metadataState: 'pending',
    derivativeState: 'pending',
    hashState: 'pending',
    failedReason: null,
    uploadCompletedAt: Date.now(),
    metadataExtractedAt: null,
    derivativesGeneratedAt: null,
  },
  metrics: {
    views: 0,
    favorites: 0,
    shares: 0,
    comments: 0,
  }
}
```

---

## 7. Asset events subcollection

Use `assets/{assetId}/events/{eventId}` as an audit trail. This is strongly recommended.

### 7.1 Purpose

This subcollection supports:

- debugging
- moderation history
- upload lifecycle tracing
- future analytics
- operator visibility

### 7.2 TypeScript types

```ts
export type AssetEventType =
  | 'upload_started'
  | 'upload_completed'
  | 'processing_started'
  | 'metadata_extracted'
  | 'derivatives_generated'
  | 'submitted_for_review'
  | 'scan_requested'
  | 'scan_completed'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'removed'
  | 'archived'
  | 'processing_failed';

export interface AssetEventDoc {
  id: string;
  assetId: string;
  actorId?: string | null;
  type: AssetEventType;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: number;
}
```

### 7.3 Minimum event recommendations

At minimum, log these transitions:

- upload completed
- processing started
- processing failed
- submitted for review
- approved
- rejected
- published
- removed

---

## 8. Storage path conventions

Uploads should be private by default.

### 8.1 Recommended paths

```txt
uploads/quarantine/{assetId}/original
uploads/quarantine/{assetId}/preview
uploads/quarantine/{assetId}/thumbnail

uploads/public/{assetId}/original
uploads/public/{assetId}/preview
uploads/public/{assetId}/thumbnail
```

### 8.2 Rules

- New user uploads must land in `uploads/quarantine/...`
- Public gallery code must never read directly from quarantine paths
- Publication should copy/move/activate public delivery only after approval
- Do not rely on raw upload path visibility for access control; enforce it with rules and status checks

---

## 9. Rate-limit model

Rate limits should be checked before accepting the upload workflow.

### 9.1 Recommended first-pass rules

For `basic` users:

- `dailyUploadLimit = 3`
- `weeklyUploadLimit = 10`
- `monthlyUploadLimit = 30`
- `burstLimitPerHour = 2`

For `trusted` users:

- `dailyUploadLimit = 10`
- `weeklyUploadLimit = 40`
- `monthlyUploadLimit = 120`
- `burstLimitPerHour = 5`

For `restricted` users:

- `canUpload = false` or use severe reduced limits

### 9.2 Enforcement notes

Upload should fail early if any of the following are true:

- `canUpload === false`
- `suspendedUntil` is in the future
- current window usage exceeds any limit
- user role or auth state is invalid

---

## 10. Security and query rules

### 10.1 Public app queries
Public feed, search, tag, and profile content queries must only return assets where:

```ts
status === 'published' && visibility === 'public'
```

### 10.2 Uploader visibility
The owner may read their own non-public uploads, subject to product rules.

### 10.3 Moderator visibility
Moderators and admins may read pending, rejected, removed, and archived assets required for review.

### 10.4 Write restrictions
Non-admin users must not be able to set:

- `status = 'published'`
- `moderation.finalDecision = 'approved'`
- `moderation.reviewedBy`
- `moderation.reviewedAt`
- public delivery URLs if publication is server-controlled

These fields should be controlled by trusted backend logic or privileged operators only.

---

## 11. Implementation scope for the first pass

The first pass should include:

1. shared TypeScript schema/types for upload-related documents
2. default factory helpers for:
   - `UserUploadProfile`
   - `AssetDoc`
   - `AssetEventDoc`
3. validation helpers for enum-like fields
4. storage path helper functions
5. public query predicate helpers
6. clear separation between:
   - asset lifecycle state
   - moderation state
   - processing state
   - user upload rate-limit state

The first pass does **not** need to include:

- upload UI
- Cloud Functions
- moderation API integration
- review dashboard
- Firestore rules implementation
- counters synchronization logic

This task is for **data model setup only**.

---

# Part 2 — Codex prompt

Use the prompt below as-is or with minor path adjustments.

```text
You are working on the Memetrest codebase.

Task:
Set up the upload data model foundation for authenticated-user uploads with rate limiting, moderation state, and upload→publish lifecycle separation.

Important context:
- Memetrest is a meme/image/gif discovery web app.
- Upload is only available to authenticated users.
- Upload is NOT publish.
- Uploaded assets must be private by default and only become public after approval.
- This task is ONLY for data model / schema setup.
- Do not build the upload UI yet.
- Do not implement Cloud Functions yet.
- Do not wire moderation APIs yet.
- Do not add speculative features beyond the schema utilities.

Please implement the following in a clean, production-minded way.

1) Create or update shared TypeScript domain types for:
- UserRole
- UploadTrustTier
- UserUploadLimits
- UserUploadUsage
- UserModerationHealth
- UserUploadProfile
- UserDoc additions related to upload profile

- AssetKind
- AssetStatus
- AssetVisibility
- ProcessingState
- ModerationScanState
- ModerationScanResult
- ModerationDecision
- RejectionReasonCode
- AssetStoragePaths
- AssetUrls
- AssetDimensions
- AssetSourceInfo
- AssetModeration
- AssetProcessing
- AssetMetrics
- AssetDoc

- AssetEventType
- AssetEventDoc

Use these exact enum unions unless there is a compelling existing project convention that requires equivalent naming:
- UserRole: 'user' | 'moderator' | 'admin'
- UploadTrustTier: 'basic' | 'trusted' | 'restricted'
- AssetKind: 'image' | 'gif'
- AssetStatus: 'uploaded' | 'processing' | 'pending_review' | 'published' | 'rejected' | 'removed' | 'archived'
- AssetVisibility: 'private' | 'unlisted' | 'public'
- ProcessingState: 'pending' | 'running' | 'completed' | 'failed'
- ModerationScanState: 'not_requested' | 'queued' | 'running' | 'completed' | 'failed'
- ModerationScanResult: 'unknown' | 'clean' | 'borderline' | 'explicit'
- ModerationDecision: 'pending' | 'approved' | 'rejected'
- RejectionReasonCode:
  'policy_explicit'
  | 'policy_violence'
  | 'policy_hate'
  | 'spam'
  | 'duplicate'
  | 'low_quality'
  | 'invalid_file'
  | 'copyright'
  | 'other'

2) Add factory/helper functions for defaults:
- createDefaultUserUploadProfile(trustTier?: UploadTrustTier)
- createInitialAssetDoc(input: ...)
- createAssetEvent(input: ...)

Requirements for defaults:
- Basic users default to:
  - canUpload: true
  - dailyUploadLimit: 3
  - weeklyUploadLimit: 10
  - monthlyUploadLimit: 30
  - burstLimitPerHour: 2
- Trusted users should get higher limits
- Restricted users should either have canUpload false or extremely low limits

For assets:
- default status must be 'uploaded'
- default visibility must be 'private'
- moderation.finalDecision must default to 'pending'
- moderation.scanState must default to 'not_requested'
- moderation.scanResult must default to 'unknown'
- processing states must default to 'pending'
- metrics must default to zero
- timestamps should be initialized consistently with the project’s time conventions

3) Add validation helpers / type guards where appropriate, for example:
- isPublicAsset(asset)
- canAssetBePublic(asset)
- isUploadSuspended(uploadProfile, now)
- hasExceededUploadLimits(uploadProfile, now, nextCountIncrement?)
- isReviewableAssetStatus(status)

Keep them small and composable.

4) Add storage path helpers for upload lifecycle:
- getQuarantineOriginalPath(assetId)
- getQuarantinePreviewPath(assetId)
- getQuarantineThumbnailPath(assetId)
- getPublicOriginalPath(assetId)
- getPublicPreviewPath(assetId)
- getPublicThumbnailPath(assetId)

Use this path shape:
- uploads/quarantine/{assetId}/original
- uploads/quarantine/{assetId}/preview
- uploads/quarantine/{assetId}/thumbnail
- uploads/public/{assetId}/original
- uploads/public/{assetId}/preview
- uploads/public/{assetId}/thumbnail

5) Keep the code organized.
Prefer:
- one shared upload schema/types module
- one helper/factory module
- one validator/guard module
- one storage-path utility module

Adapt to the existing codebase structure if there is already a clear domain organization pattern.

6) Add concise documentation comments where the lifecycle semantics may be misunderstood, especially:
- upload is not publish
- only status='published' + visibility='public' is publicly visible
- moderation and processing states are distinct from asset status

7) If there are existing content/meme types already in the codebase:
- integrate carefully instead of duplicating conflicting concepts
- preserve backward compatibility where reasonable
- call out any schema mismatch in comments or a small markdown note if needed

8) Add a short markdown file in the repo, for example:
docs/upload-data-model.md

It should summarize:
- the main lifecycle states
- the public visibility rule
- the purpose of user upload profile, asset doc, and asset events
- the storage path conventions

Deliverables:
- code changes for the upload data model foundation
- helper utilities and defaults
- a short markdown doc
- no UI, no backend trigger logic, no moderation API calls

Before writing code, inspect the existing types/domain structure and align naming/style with the project where possible without losing the required model semantics.
```

---

# Part 3 — Recommended acceptance criteria

Use this as a review checklist after Codex completes the task.

## Schema coverage
- [ ] All upload-related user fields are typed
- [ ] Asset lifecycle fields are typed
- [ ] Moderation fields are typed
- [ ] Processing fields are typed
- [ ] Asset event typing exists

## Default helpers
- [ ] Default upload profile helper exists
- [ ] Initial asset document helper exists
- [ ] Asset event helper exists

## Visibility logic
- [ ] There is a helper for checking public visibility
- [ ] Public visibility requires both `published` and `public`

## Storage helpers
- [ ] Quarantine path helpers exist
- [ ] Public path helpers exist

## Guard helpers
- [ ] Upload suspension helper exists
- [ ] Upload limit helper exists
- [ ] Asset publishability helper exists

## Documentation
- [ ] Markdown doc exists
- [ ] Lifecycle semantics are documented clearly

---

# Part 4 — Recommended next step after schema setup

After this data model foundation is in place, the next implementation step should be:

1. authenticated upload preflight checks
2. asset document creation on upload submission
3. private/quarantine storage path usage
4. basic rate-limit enforcement
5. review/publish transition logic

Do not jump to full upload UI polish before the schema is stable.
