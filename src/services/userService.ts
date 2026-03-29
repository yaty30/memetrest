import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { UserProfile, ProfileAssetRef } from "../types/user";
import { FALLBACK_AVATAR, FALLBACK_BANNER } from "../types/user";
import type { User as FirebaseUser } from "firebase/auth";
import { getDefaultAsset } from "./profileService";

const USERS_COL = "users";
const USERNAMES_COL = "usernames";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Map raw Firestore data to a typed ProfileAssetRef. */
function mapAssetRef(
  data: Record<string, unknown> | undefined,
  fallback: ProfileAssetRef,
): ProfileAssetRef {
  if (!data || !data.assetId) return fallback;
  return {
    assetId: data.assetId as string,
    url: data.url as string,
    kind: data.kind as ProfileAssetRef["kind"],
    ownership: data.ownership as ProfileAssetRef["ownership"],
  };
}

/** Map a Firestore document snapshot to a UserProfile. */
function mapUserDoc(data: Record<string, unknown>): UserProfile {
  return {
    uid: data.uid as string,
    email: data.email as string,
    authDisplayName: (data.authDisplayName as string) ?? "",
    authPhotoURL: (data.authPhotoURL as string) ?? null,
    displayName: (data.displayName as string) ?? "",
    username: (data.username as string) ?? "",
    bio: (data.bio as string) ?? "",
    avatar: mapAssetRef(
      data.avatar as Record<string, unknown> | undefined,
      FALLBACK_AVATAR,
    ),
    banner: mapAssetRef(
      data.banner as Record<string, unknown> | undefined,
      FALLBACK_BANNER,
    ),
    role: (data.role as UserProfile["role"]) ?? "user",
    status: (data.status as UserProfile["status"]) ?? "active",
    uploadCount: (data.uploadCount as number) ?? 0,
    savedCount: (data.savedCount as number) ?? 0,
    createdAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.createdAt as any)?.toDate?.() ?? new Date(),
    lastLoginAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.lastLoginAt as any)?.toDate?.() ?? new Date(),
    profileUpdatedAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.profileUpdatedAt as any)?.toDate?.() ?? new Date(),
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Fetch a user profile from Firestore. Returns null if not found. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return null;
  return mapUserDoc(snap.data());
}

/** Subscribe to a user profile document and receive live updates. */
export function subscribeToUserProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, USERS_COL, uid),
    (snap) => {
      if (!snap.exists()) {
        onProfile(null);
        return;
      }
      onProfile(mapUserDoc(snap.data()));
    },
    onError,
  );
}

/** Look up a user profile by username via the usernames collection. */
export async function getUserByUsername(
  username: string,
): Promise<UserProfile | null> {
  const usernameSnap = await getDoc(
    doc(db, USERNAMES_COL, username.toLowerCase()),
  );
  if (!usernameSnap.exists()) return null;
  const uid = usernameSnap.data().uid as string;
  return getUserProfile(uid);
}

/**
 * Create or update a Firestore user profile on login.
 *
 * First login:
 *   Creates the profile document with default avatar/banner from
 *   the seeded `profileAssets` collection, and initialises all fields
 *   per PROFILE_SCHEMA_SPEC.md.
 *
 * Returning login:
 *   Syncs Auth-identity fields (email, authDisplayName, authPhotoURL)
 *   and updates lastLoginAt. Never overwrites user-editable fields
 *   (displayName, username, bio, avatar, banner).
 */
export async function upsertUserProfile(
  firebaseUser: FirebaseUser,
): Promise<UserProfile> {
  const ref = doc(db, USERS_COL, firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // ── First login — create profile ──────────────────────────────────

    // Fetch default preset assets (parallel). Fallbacks protect against
    // Firestore/seeding issues.
    const [defaultAvatar, defaultBanner] = await Promise.all([
      getDefaultAsset("avatar").catch(() => FALLBACK_AVATAR),
      getDefaultAsset("banner").catch(() => FALLBACK_BANNER),
    ]);

    const newProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      authDisplayName: firebaseUser.displayName ?? "",
      authPhotoURL: firebaseUser.photoURL ?? null,
      displayName: firebaseUser.displayName ?? "",
      username: "",
      bio: "",
      avatar: defaultAvatar,
      banner: defaultBanner,
      role: "user",
      status: "active",
      uploadCount: 0,
      savedCount: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      profileUpdatedAt: serverTimestamp(),
    };

    await setDoc(ref, newProfile);

    // Return a client-side copy (server timestamps resolve later)
    return {
      ...newProfile,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      profileUpdatedAt: new Date(),
    } as unknown as UserProfile;
  }

  // ── Returning login — sync Auth fields only ───────────────────────

  await updateDoc(ref, {
    lastLoginAt: serverTimestamp(),
    email: firebaseUser.email ?? "",
    authDisplayName: firebaseUser.displayName ?? "",
    authPhotoURL: firebaseUser.photoURL ?? null,
  });

  return mapUserDoc({
    ...snap.data(),
    lastLoginAt: new Date(),
    email: firebaseUser.email ?? "",
    authDisplayName: firebaseUser.displayName ?? "",
    authPhotoURL: firebaseUser.photoURL ?? null,
  });
}
