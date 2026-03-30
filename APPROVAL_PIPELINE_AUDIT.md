# Memetrest Approval-to-Publication Pipeline Audit

**Date:** March 30, 2026  
**Scope:** Full audit of the approval-to-frontpage data flow — from admin approval to home feed visibility.

---

## 1. Verdict

**Working.** The fix correctly bridges the moderation pipeline (`assets`) to the public feed (`memes`). An approved upload will appear on the frontpage.

---

## 2. What is confirmed working

### A. Approval handler behavior

- **Backend function**: `approveUploadAsset` in `functions/src/uploadHandlers.ts` (line 825) is a Cloud Function (`onCall`).
- **Asset update**: Within a Firestore transaction, it updates `assets/{assetId}` (line 904) with `status: "published"`, `visibility: "public"`, `moderation.finalDecision: "approved"`, plus timestamps and approver metadata.
- **Meme creation**: In the same transaction (line 921), it calls `tx.set(memeRef, memeDoc, { merge: true })` to create/upsert `memes/{assetId}`.
- **Bridge is server-side**: Both writes happen inside the Cloud Function transaction — not in frontend code.
- **UI wiring is correct**: `AdminApprovalView.tsx` (line 109) calls `approveUploadAsset({ assetId: item.id })`, which is a callable wrapper in `src/services/uploadPipelineService.ts` (line 568) pointing to the Cloud Function `"approveUploadAsset"`. The function is exported from `functions/src/index.ts` (line 9).

### B. Assets state after approval

Fields written to `assets/{assetId}` on approval (`uploadHandlers.ts` lines 904–917):

| Field | Value |
|---|---|
| `status` | `"published"` |
| `visibility` | `"public"` |
| `moderation.finalDecision` | `"approved"` |
| `moderation.decidedAt` | server timestamp |
| `moderation.decidedBy` | approver UID |
| `moderation.reviewedAt` | server timestamp |
| `moderation.reviewedBy` | approver UID |
| `publishedAt` | server timestamp |
| `updatedAt` | server timestamp |

This is coherent with the canonical public definition: `status === "published" && visibility === "public"` as defined in `UPLOAD_DATA_MODEL.md` and enforced by Firestore rules (`isUploadAssetPublic` in `firestore.rules` line 36).

**No issues found.** All moderation/publication fields are set consistently. No dead or duplicated status concepts.

### C. Meme creation/upsert correctness

The `mapApprovedAssetToMemeDoc` function (`uploadHandlers.ts` line 365) builds a `MemeBridgeDoc` with:

| Meme field | Source |
|---|---|
| `id` | `assetId` |
| `title` | `asset.title` (trimmed, fallback "Untitled") |
| `description` | `asset.description` |
| `tags` | normalized from asset |
| `searchKeywords` | from asset (lowercased, deduplicated) |
| `category` | existing meme doc or `"uncategorized"` |
| `templateName` | existing meme doc or `""` |
| `language` | existing or `"en"` |
| `imageUrl` | `previewUrl > originalUrl > thumbnailUrl > existing` |
| `storagePath` | `asset.storage.originalPath` |
| `mimeType` | from asset |
| `animated` | `isAnimated` or GIF MIME |
| `thumbnailUrl` | from asset URLs |
| `width`, `height`, `aspectRatio` | from asset dimensions with fallbacks |
| `nsfw` | `true` if scanResult is `"explicit"` |
| `sensitive` | `moderation.userSensitiveFlag` |
| **`status`** | **hardcoded `"approved"`** |
| `uploadedBy` | `asset.ownerId` |
| `overlay` | `{ avatar, name }` denormalized from owner profile |
| `moderatedBy` | from moderation or approver |
| `moderatedAt` | timestamp |
| `publishedAt` | timestamp |
| `createdAt` | preserved if existing, otherwise asset creation time |
| `likeCount` / `shareCount` / `downloadCount` / `popularityScore` | preserved if existing, otherwise `0` |

**All fields required by the home feed are present.** The doc is created with `{ merge: true }` making it **idempotent** — safe for retry. Doc ID is `assetId`, making it **deterministic**.

### D. Frontpage compatibility

Home feed query in `src/services/firebaseMemeService.ts` (line 101):

```ts
collection("memes") WHERE status == "approved"
```

The meme bridge writes `status: "approved"` (hardcoded in `MemeBridgeDoc`). **This matches exactly.**

All other query requirements are satisfied:

- `imageUrl`: populated from asset URLs (previewUrl preferred)
- `nsfw`: set (default `false` unless explicit scan)
- `tags` / `searchKeywords`: copied from asset
- `category`: defaults to `"uncategorized"` (valid)
- Sort fields (`createdAt`, `likeCount`, `popularityScore`): all present with defaults
- `overlay`: denormalized from owner profile at approval time

Firestore security rules allow reads of `memes/{id}` where `resource.data.status == 'approved'` (`firestore.rules` line 99) — matches.

**No hidden conditions that would prevent display.**

### E. End-to-end data flow integrity

```
Upload → assets/{id} (status=pending_review, visibility=public)
         ↓
Admin approve → Firestore transaction:
  1. assets/{id} ← status=published, visibility=public, moderation.finalDecision=approved
  2. assets/{id}/events/{eid} ← type=approved
  3. memes/{id} ← full MemeBridgeDoc with status="approved"
         ↓
Home feed → collection("memes").where("status","==","approved") → finds it
```

- No missing step between approval and visibility.
- No separate manual publish action required.
- No stale legacy path — the upload pipeline uses `assets` + moderation, and the bridge creates the `memes` doc atomically.
- Schema is consistent: `MemeBridgeDoc` maps directly to what `mapDoc()` in the service expects.

### F. Error handling / consistency

- **Transactional**: Asset update + event creation + meme upsert all happen inside `db.runTransaction()` (`uploadHandlers.ts` line 843). If any write fails, all are rolled back.
- **Idempotency**: If already approved (`isAlreadyApproved` check at line 853), asset update and event creation are skipped, but `memes/{id}` is still upserted (self-healing). Re-approving is safe.
- **Merge semantics**: `tx.set(memeRef, memeDoc, { merge: true })` means existing counters/fields are preserved on retry.
- **Duplicate prevention**: Doc ID = `assetId`, so multiple approvals update the same doc.
- **Counter safety**: Counters are initialized to `0` only if absent in existing meme doc.

### G. Existing data / backfill concern

Any assets that were approved **before this bridge was deployed** would have `status: "published"` in `assets` but **no corresponding `memes/{id}` document**. These items would be invisible on the frontpage.

- **Affected subset**: All assets previously approved through a legacy path (if any).
- **Detection**: Query `assets` where `status == "published" AND visibility == "public"` and check for missing `memes/{id}` counterparts.
- **Backfill**: Could re-run approval on each (the idempotent re-approval path handles this), or write a migration script.

### H. UI wiring validation

| Layer | Component / Function | Target |
|---|---|---|
| Admin button | `AdminApprovalView.tsx` → `onApprove` | calls `runAction(item, "approve")` |
| Action handler | `runAction` (line 108) | calls `approveUploadAsset({ assetId: item.id })` |
| Service wrapper | `uploadPipelineService.ts` → `approveUploadAsset()` | `httpsCallable(functionsClient, "approveUploadAsset")` |
| Cloud Function | `functions/src/index.ts` exports `approveUploadAsset` | from `uploadHandlers.ts` |
| Handler | `approveUploadAsset` onCall | transaction: update asset + create event + upsert meme |

**The button is wired to the corrected handler. No stale approval path exists.**

---

## 3. Gaps / risks still present

### 3a. Admin custom claim requirement (Medium risk)

The backend checks `request.auth.token.admin === true` (`uploadHandlers.ts` line 149). This requires a **Firebase Auth custom claim** (`admin: true`) on the user token. The frontend admin check uses `profile.role === "admin"` (Firestore doc field). If the custom claim isn't set for an admin user, the Cloud Function will reject with `permission-denied` even though the UI shows the admin panel. **This is a deployment/provisioning concern**, not a code bug — but must be verified.

### 3b. `getRelatedMemes` doesn't filter by `status` (Low risk)

`getRelatedMemes` in `firebaseMemeService.ts` (line 275) queries by `templateName` and `category` without a `where("status", "==", "approved")` constraint. This could surface non-approved memes in the "related" section. Mitigated by Firestore rules blocking reads of non-approved memes for non-moderators, but the query would throw a permission error rather than silently filtering.

### 3c. `imageUrl` depends on storage URL population (Low-Medium risk)

The meme `imageUrl` is resolved as `previewUrl > originalUrl > thumbnailUrl`. If the asset's `urls` object was never populated (e.g., storage URLs not yet generated at finalization time), `imageUrl` could be an empty string. The `mapDoc` function maps empty `imageUrl` to `image: ""` which would render as a broken image. In practice, the upload pipeline populates these URLs during `finalizeUploadAsset`, so this should be populated — but if derivatives haven't been generated, `previewUrl` and `thumbnailUrl` could be `null`, falling back to `originalUrl`.

### 3d. Rejection handler not deployed (Moderate risk — not a blocker)

`rejectUploadAsset` exists as a frontend callable wrapper, but the backend function is **not yet deployed**. The admin UI will show an error on rejection attempts. This doesn't block the approval → frontpage flow but is a gap in the full moderation pipeline.

---

## 4. End-to-end flow summary

| Step | Location | Action | Result |
|---|---|---|---|
| 1. Upload | `UploadAssetView` → `uploadAssetThroughBackend()` | `initializeUpload()` + Storage upload + `finalizeUploadAsset()` | `assets/{id}` created with `status=pending_review` (if public) |
| 2. Queue | `AdminApprovalView` → `usePendingApprovalQueue` | Subscribes to `assets` where `status == "pending_review"` | Admin sees pending items |
| 3. Approve | Admin clicks Approve → `approveUploadAsset({ assetId })` | Cloud Function transaction | `assets/{id}` → published/public **+** `memes/{id}` → `status="approved"` with full schema |
| 4. Display | `HomeGalleryView` → `usePaginatedMemes` → `queryMemes()` | `collection("memes").where("status","==","approved")` | New meme appears in feed |

### Test scenario

After approving asset `abc123` owned by user `user456`:

**`assets/abc123`** updated fields:

```json
{
  "status": "published",
  "visibility": "public",
  "moderation": {
    "finalDecision": "approved",
    "decidedAt": "<timestamp>",
    "decidedBy": "<adminUid>",
    "reviewedAt": "<timestamp>",
    "reviewedBy": "<adminUid>"
  },
  "publishedAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

**`memes/abc123`** created/merged:

```json
{
  "id": "abc123",
  "title": "My Meme",
  "description": "",
  "status": "approved",
  "imageUrl": "<previewUrl>",
  "tags": ["funny"],
  "searchKeywords": ["fun", "funn", "funny"],
  "category": "uncategorized",
  "nsfw": false,
  "sensitive": false,
  "animated": false,
  "width": 800,
  "height": 600,
  "aspectRatio": 1.33,
  "uploadedBy": "user456",
  "overlay": { "name": "UserName", "avatar": "<avatarUrl>" },
  "likeCount": 0,
  "shareCount": 0,
  "downloadCount": 0,
  "popularityScore": 0,
  "createdAt": "<timestamp>",
  "moderatedAt": "<timestamp>",
  "moderatedBy": "<adminUid>"
}
```

Home feed query `memes WHERE status == "approved"` → **matches** → appears on frontpage.

---

## 5. Recommended next fixes (priority order)

| Priority | Issue | Fix |
|---|---|---|
| **P1** | Verify admin users have `admin: true` custom claim in Firebase Auth | Run `admin.auth().setCustomUserClaims(uid, { admin: true })` for each admin. Without this, the approve button will 403. |
| **P2** | Deploy `rejectUploadAsset` backend function | Implement and export from `functions/src/index.ts` — currently the reject action in the admin UI has no backend. |
| **P2** | Backfill previously approved assets missing from `memes` | Script to query `assets` where `status=="published" AND visibility=="public"`, then for each, call the approval function (idempotent) or directly write `memes/{id}`. |
| **P3** | Add `where("status","==","approved")` to `getRelatedMemes` queries | Prevents permission errors and data leaks in the related memes section. |
| **P3** | Validate `imageUrl` is non-empty before meme creation | Add a guard in `mapApprovedAssetToMemeDoc` to throw if no image URL is resolvable. |
