# Upload Backend Contract (Minimal Authority Slice)

This document defines the first server-authoritative backend surface for additive upload assets.

Scope is intentionally narrow:

- Auth-required upload initialization
- Server-side upload asset creation/finalization
- Server-enforced default lifecycle/visibility/moderation/processing/metrics
- Asset event creation on server mutations
- Owner-only review submission transition (`uploaded -> pending_review`)

Not included in this phase:

- publish endpoint
- moderation provider integrations
- admin review tooling
- legacy meme migration

## Handlers

## `initializeUpload`

Callable handler.

Responsibilities:

- require authenticated caller
- load `users/{uid}` and read `uploadProfile` (fallback to default profile if missing)
- enforce upload suspension and rate limits
- generate server-owned `assetId`
- return deterministic quarantine paths:
  - `uploads/quarantine/{assetId}/original`
  - `uploads/quarantine/{assetId}/preview`
  - `uploads/quarantine/{assetId}/thumbnail`

Response shape:

- `assetId`
- `ownerId`
- `uploadIssuedAt` (unix ms)
- `quarantinePaths`

## `finalizeUploadAsset`

Callable handler.

Responsibilities:

- require authenticated caller
- validate payload shape (title, mimeType, fileSize, dimensions, tags)
- verify user exists and enforce suspension/limits again (server-authoritative)
- create `assets/{assetId}` with server defaults:
  - `ownerId` from auth
  - `status = uploaded`
  - `visibility = private`
  - default moderation state
  - default processing state
  - metrics zeroed
  - canonical timestamps
- create `assets/{assetId}/events/{eventId}` with `upload_completed`
- increment user upload usage counters in `uploadProfile`
- ignore any client intent to create public/published assets

## `submitAssetForReview`

Callable handler.

Responsibilities:

- require authenticated caller
- require caller to own the asset
- allow review submission for reviewable states only
- perform transition:
  - `uploaded -> pending_review`
- append `submitted_for_review` event
- no publish behavior
- no moderator/admin path in this phase

Idempotency behavior:

- if asset already `pending_review`, returns `submitted: false` and leaves state unchanged

## Security guarantees in this phase

- Clients cannot directly set ownership for assets created via backend handlers.
- Clients cannot set initial `published/public` state via backend handlers.
- Clients cannot set moderation decisions via backend handlers.
- Clients cannot create server event history via backend handlers.

Important semantic split:

- Canonical public visibility remains: `status === "published" && visibility === "public"`.
- Workflow eligibility checks are separate and do not redefine canonical public visibility.

## Intended Firestore rule posture (documented, not implemented here)

For complete enforcement, rules should ultimately ensure untrusted clients cannot:

- create `assets` docs directly with `status=published` and `visibility=public`
- spoof `ownerId`
- write `assets/{assetId}/events/*`

This pass keeps rules changes out of scope and focuses on server-authoritative mutations.

## Rules hardening now applied

The minimal rules backstop for this phase is now enforced:

- Firestore `assets/{assetId}`: direct client create/update/delete is blocked.
- Firestore `assets/{assetId}/events/{eventId}`: direct client create/update/delete is blocked.
- Firestore `users/{uid}`: owner updates cannot mutate `uploadProfile` (backend-authoritative).
- Firestore asset reads: canonical public assets are readable; private assets/events are owner/moderator scoped.
- Storage `uploads/public/{assetId}/{variant}`: client writes are blocked.
- Storage `uploads/quarantine/{assetId}/{variant}`: auth-only constrained writes; reads blocked.

## Temporary limitation

Storage ownership proof for quarantine writes is not fully derivable from the current path shape (`uploads/quarantine/{assetId}/{variant}`) alone. In this phase, ownership enforcement is completed server-side during `finalizeUploadAsset` and review submission.
