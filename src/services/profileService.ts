import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import type {
  ProfileAsset,
  ProfileAssetKind,
  ProfileAssetRef,
} from "../types/user";
import {
  USERNAME_PATTERN,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  RESERVED_USERNAMES,
  DISPLAY_NAME_MAX_LENGTH,
  BIO_MAX_LENGTH,
  BIO_MAX_LINE_BREAKS,
  FALLBACK_AVATAR,
  FALLBACK_BANNER,
} from "../types/user";

const PROFILE_ASSETS_COL = "profileAssets";
const USERNAMES_COL = "usernames";
const USERS_COL = "users";

// ── Firestore → TypeScript mapper ───────────────────────────────────────────

function mapProfileAssetDoc(data: Record<string, unknown>): ProfileAsset {
  return {
    id: data.id as string,
    kind: data.kind as ProfileAsset["kind"],
    ownership: data.ownership as ProfileAsset["ownership"],
    label: data.label as string,
    url: data.url as string,
    storagePath: data.storagePath as string,
    width: (data.width as number) ?? 0,
    height: (data.height as number) ?? 0,
    category: (data.category as string) ?? "general",
    tags: (data.tags as string[]) ?? [],
    sortOrder: (data.sortOrder as number) ?? 0,
    isDefault: (data.isDefault as boolean) ?? false,
    uploadedBy: (data.uploadedBy as string) ?? null,
    status: (data.status as ProfileAsset["status"]) ?? "approved",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: (data.createdAt as any)?.toDate?.() ?? new Date(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: (data.updatedAt as any)?.toDate?.() ?? new Date(),
  };
}

// ── Asset queries ───────────────────────────────────────────────────────────

/** Fetch the default preset asset for a given kind ("avatar" | "banner"). */
export async function getDefaultAsset(
  kind: ProfileAssetKind,
): Promise<ProfileAssetRef> {
  const q = query(
    collection(db, PROFILE_ASSETS_COL),
    where("kind", "==", kind),
    where("isDefault", "==", true),
    limit(1),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    console.warn(`No default ${kind} found in profileAssets, using fallback`);
    return kind === "avatar" ? FALLBACK_AVATAR : FALLBACK_BANNER;
  }

  const asset = mapProfileAssetDoc(snap.docs[0].data());
  return {
    assetId: asset.id,
    url: asset.url,
    kind: asset.kind,
    ownership: asset.ownership,
  };
}

/** Fetch all approved preset assets for a given kind, sorted by sortOrder. */
export async function getPresetAssets(
  kind: ProfileAssetKind,
): Promise<ProfileAsset[]> {
  const q = query(
    collection(db, PROFILE_ASSETS_COL),
    where("kind", "==", kind),
    where("ownership", "==", "preset"),
    where("status", "==", "approved"),
    orderBy("sortOrder", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapProfileAssetDoc(d.data()));
}

// ── Profile field updates ───────────────────────────────────────────────────

/** Editable fields that a user can update on their own profile. */
export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: ProfileAssetRef;
  banner?: ProfileAssetRef;
}

/** Update user-editable profile fields. Validates inputs before writing. */
export async function updateProfile(
  uid: string,
  fields: ProfileUpdate,
): Promise<void> {
  const updates: Record<string, unknown> = {
    profileUpdatedAt: serverTimestamp(),
  };

  if (fields.displayName !== undefined) {
    const name = fields.displayName.trim().replace(/\s{2,}/g, " ");
    if (name.length === 0) throw new Error("Display name cannot be empty");
    if (name.length > DISPLAY_NAME_MAX_LENGTH) {
      throw new Error(`Display name max ${DISPLAY_NAME_MAX_LENGTH} characters`);
    }
    updates.displayName = name;
  }

  if (fields.bio !== undefined) {
    const bio = fields.bio.trim();
    if (bio.length > BIO_MAX_LENGTH) {
      throw new Error(`Bio max ${BIO_MAX_LENGTH} characters`);
    }
    const lineBreaks = (bio.match(/\n/g) || []).length;
    if (lineBreaks > BIO_MAX_LINE_BREAKS) {
      throw new Error(`Bio max ${BIO_MAX_LINE_BREAKS} line breaks`);
    }
    updates.bio = bio;
  }

  if (fields.avatar !== undefined) {
    await validateAssetRef(fields.avatar, "avatar");
    updates.avatar = fields.avatar;
  }

  if (fields.banner !== undefined) {
    await validateAssetRef(fields.banner, "banner");
    updates.banner = fields.banner;
  }

  await updateDoc(doc(db, USERS_COL, uid), updates);
}

/** Validate that an asset reference points to an existing, approved asset of the correct kind. */
async function validateAssetRef(
  ref: ProfileAssetRef,
  expectedKind: ProfileAssetKind,
): Promise<void> {
  if (ref.kind !== expectedKind) {
    throw new Error(
      `Asset kind mismatch: expected ${expectedKind}, got ${ref.kind}`,
    );
  }
  const snap = await getDoc(doc(db, PROFILE_ASSETS_COL, ref.assetId));
  if (!snap.exists()) {
    throw new Error(`Asset ${ref.assetId} does not exist`);
  }
  const data = snap.data();
  if (data.status !== "approved") {
    throw new Error(`Asset ${ref.assetId} is not approved`);
  }
  if (data.kind !== expectedKind) {
    throw new Error(
      `Asset ${ref.assetId} is a ${data.kind}, not a ${expectedKind}`,
    );
  }
}

// ── Username operations ─────────────────────────────────────────────────────

/** Validate a username string. Throws on invalid input. */
export function validateUsername(username: string): string {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < USERNAME_MIN_LENGTH) {
    throw new Error(
      `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    );
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    throw new Error(
      `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    );
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error(
      "Username may only contain lowercase letters, numbers, underscores, and periods",
    );
  }
  if ((RESERVED_USERNAMES as readonly string[]).includes(normalized)) {
    throw new Error("This username is reserved");
  }

  return normalized;
}

/**
 * Claim a username transactionally via the `usernames/{username}` collection.
 * Releases the user's previous username (if any) in the same transaction.
 */
export async function claimUsername(
  uid: string,
  newUsername: string,
): Promise<void> {
  const normalized = validateUsername(newUsername);

  await runTransaction(db, async (txn) => {
    // Read current profile to find old username
    const profileRef = doc(db, USERS_COL, uid);
    const profileSnap = await txn.get(profileRef);
    if (!profileSnap.exists()) {
      throw new Error("User profile does not exist");
    }
    const oldUsername = (profileSnap.data().username as string) || "";

    // Check new username is free
    const newUsernameRef = doc(db, USERNAMES_COL, normalized);
    const existingSnap = await txn.get(newUsernameRef);
    if (existingSnap.exists()) {
      const ownerUid = existingSnap.data().uid as string;
      if (ownerUid !== uid) {
        throw new Error("Username is already taken");
      }
      // User already owns this username — no-op
      return;
    }

    // Release old username if any
    if (oldUsername && oldUsername !== normalized) {
      txn.delete(doc(db, USERNAMES_COL, oldUsername));
    }

    // Claim new username
    txn.set(newUsernameRef, { uid, createdAt: serverTimestamp() });

    // Update profile
    txn.update(profileRef, {
      username: normalized,
      profileUpdatedAt: serverTimestamp(),
    });
  });
}

/** Release the current username (if any) without claiming a new one. */
export async function releaseUsername(uid: string): Promise<void> {
  await runTransaction(db, async (txn) => {
    const profileRef = doc(db, USERS_COL, uid);
    const profileSnap = await txn.get(profileRef);
    if (!profileSnap.exists()) return;

    const oldUsername = (profileSnap.data().username as string) || "";
    if (!oldUsername) return;

    txn.delete(doc(db, USERNAMES_COL, oldUsername));
    txn.update(profileRef, {
      username: "",
      profileUpdatedAt: serverTimestamp(),
    });
  });
}
