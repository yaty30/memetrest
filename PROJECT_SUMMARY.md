# Memetrest — Project Summary

> **Last updated:** March 31, 2026
> **Live URL:** https://memetrest-b57dc.web.app
> **Firebase project:** memetrest-b57dc

---

## 1. What is Memetrest?

Memetrest is a **meme discovery, sharing, and upload platform** built as a modern single-page application. Users can browse a curated meme gallery, like and share memes, upload their own content, customize their profiles, and (for admins) moderate incoming submissions through an approval pipeline.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.9, Vite 8 |
| **UI Library** | MUI (Material UI) 7, Lucide icons |
| **State** | Redux Toolkit (RTK) |
| **Routing** | React Router DOM 7 |
| **Backend** | Firebase Cloud Functions (2nd Gen, Node.js 20) |
| **Database** | Cloud Firestore |
| **Storage** | Firebase Cloud Storage |
| **Auth** | Firebase Authentication (Google sign-in) |
| **Hosting** | Firebase Hosting |

---

## 3. Features

### 3.1 Meme Gallery (Home)
- **Masonry / waterfall grid** layout (Pinterest-style) with 1/3/4 responsive columns
- **Infinite scroll** with Firestore cursor-based pagination (20 items/page)
- **Search** by text (keyword matching against `searchKeywords` field)
- **Filter** by category (reaction, classic, animals, surreal, opinion, wholesome, dark, gaming, anime, tech)
- **Sort** by newest, most liked, trending
- **Tag-based discovery** with tag aliases and normalization
- GIF badge overlay for animated content

### 3.2 Meme Detail / Viewer
- Dedicated route: `/meme/:id`
- Full-size image display with metadata (title, description, tags, category)
- **Like** (heart) with optimistic UI + server-side transactional counter
- **Share** and **download** actions with engagement counter increments
- **Related memes** section (by shared tags/template)
- Uploader info overlay (avatar + name)
- Time-ago display for creation date

### 3.3 Lightbox
- Full-screen modal viewer with image pane + sidebar
- Comment system (seeded with placeholder comments, UI for input)
- Like, share, download, embed actions

### 3.4 Upload System
- Dedicated upload page (`/upload`), auth-gated
- **Multi-step backend pipeline:**
  1. `initializeUpload` — server validates limits, creates asset doc, returns quarantine storage paths
  2. Client uploads file to quarantine path
  3. `finalizeUploadAsset` — server records metadata, dimensions, tags, visibility
  4. `submitAssetForReview` — transitions status to `pending_review`
  5. `approveUploadAsset` — admin approves, promotes to published
- Supported formats: JPEG, PNG, WebP, GIF
- Size limits: 10 MB (static), 8 MB (GIF)
- Client-side validation before upload
- Title auto-derived from filename, manual tags, description, visibility toggle

### 3.5 Upload Rate Limiting
- Per-user upload profile with trust tiers: `basic`, `trusted`, `restricted`
- Configurable limits: hourly burst, daily, weekly, monthly
- Rolling window counters stored in user doc
- Suspension support (time-based upload bans)
- **Current dev status:** Limits temporarily set to effectively unlimited (hotfix applied)

### 3.6 My Uploads
- Route: `/my-uploads`
- Lists all user's uploaded assets with status cards
- "Submit for review" action per asset
- Status indicators: uploaded, pending_review, published, rejected, removed

### 3.7 Admin Approval Pipeline
- Route: `/admin/approvals` (admin-only, role-gated)
- Queue of all `pending_review` assets
- Filter by type (image/gif), risk level
- Sort by newest/oldest
- Approve / reject actions with detail modal
- Batch moderation support

### 3.8 User Profiles
- Route: `/profile` (own) and `/u/:username` (public)
- **Profile header:** avatar, banner, display name, username, bio
- **Editable fields:** display name, username (unique, validated), bio (300 char max)
- **Avatar & banner picker** from preset gallery (`profileAssets` collection)
- **Profile tabs:** About, Uploads
- Upload count display
- Auth-sourced fields preserved separately (`authDisplayName`, `authPhotoURL`)

### 3.9 Like System
- Transactional like/unlike via Cloud Function (`setMemeLike`)
- Atomic counter updates in Firestore transaction
- Optimistic UI via Redux (`memeLikeSlice`)
- Like state hydration from `memeLikes` collection
- Sign-in prompt for unauthenticated users

### 3.10 Authentication
- Firebase Auth with Google sign-in
- Auto profile creation on first login
- Real-time profile subscription via `onSnapshot`
- Redux hydration of current user profile
- Auth state propagated via React Context (`AuthProvider`)

### 3.11 Theme
- Dark mode by default (with toggle infrastructure)
- Custom MUI palette: glass surfaces, overlay text, gradients, scrollbar, custom shadows
- Google Sans / Inter font family
- Glassmorphism design language (blur, transparency, rounded corners)

---

## 4. Architecture

### 4.1 Frontend Architecture
```
src/
├── pages/          # Route-level page components (layout shells)
├── views/          # Feature views (business UI logic)
├── components/     # Reusable UI components
│   ├── admin/      # Approval pipeline UI
│   ├── lightbox/   # Lightbox modal system
│   ├── navigation/ # Navbar, brand, links, user menu
│   └── profile/    # Profile header, tabs, asset picker, edit dialog
├── hooks/          # Custom React hooks (data fetching, state)
├── services/       # Data access layer (Firestore, Storage, Functions)
├── store/          # Redux slices (currentUserProfile, memeLike)
├── providers/      # React Context providers (Auth, Theme)
├── types/          # TypeScript type definitions
├── utils/          # Pure utility functions
└── theme/          # MUI theme configuration
```

### 4.2 Backend Architecture (Cloud Functions)
```
functions/src/
├── index.ts              # Function exports
├── uploadHandlers.ts     # Upload pipeline (initialize, finalize, submit, approve)
├── memeLikeHandlers.ts   # Like/unlike transactional handler
└── memeLikeLogic.ts      # Pure like mutation logic
```

### 4.3 Firestore Collections

| Collection | Purpose |
|---|---|
| `memes` | Published meme gallery items |
| `users/{uid}` | User profiles with upload profiles |
| `usernames/{username}` | Username uniqueness reverse lookup |
| `profileAssets/{assetId}` | Preset avatar and banner assets |
| `assets/{assetId}` | Upload pipeline asset documents |
| `assets/{assetId}/events` | Upload asset audit trail events |
| `memeLikes/{uid_memeId}` | Like state per user-meme pair |

### 4.4 Storage Layout
```
uploads/
├── {uid}/{filename}                    # Legacy direct uploads
├── quarantine/{assetId}/{variant}      # Upload pipeline (pre-approval)
└── public/{assetId}/{variant}          # Approved assets
```
Variants: `original`, `preview`, `thumbnail`

---

## 5. Business Logic

### 5.1 Upload Lifecycle
`uploaded → pending_review → published / rejected / removed`

- Upload ≠ publish — all uploads start private
- Public visibility requires `status === "published"` AND `visibility === "public"`
- Moderation approval is a workflow gate, not part of visibility definition

### 5.2 Trust Tiers & Rate Limits

| Tier | Hourly | Daily | Weekly | Monthly |
|---|---|---|---|---|
| basic | 2 | 3 | 10 | 30 |
| trusted | 5 | 10 | 40 | 120 |
| restricted | 0 | 0 | 0 | 0 |

*(Currently overridden to unlimited for development)*

### 5.3 Moderation Model
- Per-asset: `scanState`, `scanResult`, `finalDecision` (pending/approved/rejected)
- Per-user: approval count, rejection count, strike count, suspended-until
- Admin-only approval actions via Cloud Function

### 5.4 Access Control
- **Firestore rules:** role-based (user/moderator/admin), owner-based writes
- **Storage rules:** owner-only writes, 10 MB limit, image MIME types only
- **Frontend guards:** auth-gated pages (upload, my-uploads, admin), role checks

---

## 6. Scripts & Tooling

| Script | Purpose |
|---|---|
| `seedFirestore.ts` | Seed initial meme data |
| `seedProfileAssets.ts` | Seed preset avatars/banners |
| `backfillMemeSearchKeywords.ts` | Generate search keywords for existing memes |
| `backfillMemeLikeCount.ts` | Reconcile like counters |
| `backfillFirestoreIntrinsicDimensions.mjs` | Fix image dimension metadata |
| `backfillUploadPreviewUrls.ts` | Generate preview URLs |
| `backfillApprovedAssetsToMemes.ts` | Promote approved assets to memes collection |
| `patchMemesApproved.ts` | Batch-approve memes |
| `resetAndReseed.ts` | Full data reset |

---

## 7. Deployment

| Command | Scope |
|---|---|
| `npm run deploy` | Hosting + Functions |
| `npm run golive` | Hosting only |
| `npm run build` | TypeScript + Vite build |
| `npm run test` | Vitest runner |

---

## 8. Current Status & Recent Changes

### Completed
- Full meme gallery with search, filters, sort, infinite scroll
- Upload pipeline (5-step Cloud Function backend)
- Admin approval queue with filtering and moderation
- User profile system (avatar/banner picker, username uniqueness, editable fields)
- Like system with transactional consistency
- Lightbox viewer with comment UI
- Dark mode glassmorphism design
- Firestore security rules with role-based access
- Storage security rules with size/type validation
- Backfill and seeding scripts

### Recent Hotfix (March 31, 2026)
- **Issue:** `initializeUpload` was failing with `resource-exhausted` due to upload rate limits stored in Firestore user docs
- **Fix 1:** Set basic-tier limits to effectively unlimited in `uploadDefaults.ts` for development
- **Fix 2:** Changed `readUploadProfile` in `uploadHandlers.ts` to always derive limits from code defaults (by trust tier) instead of using stale Firestore-stored limits — ensures deploys take effect immediately
- **Status:** Deployed and operational

### Pending / Future
- Light mode theme implementation
- Comment system backend (currently UI-only with seed data)
- Automated content moderation / scanning integration
- Custom profile asset uploads (user-uploaded avatars/banners)
- Follower system
- Collections / saved memes
- View count tracking
- Notification system
- Restore production upload rate limits before launch
