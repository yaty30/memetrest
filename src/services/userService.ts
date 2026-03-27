import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import type { UserProfile } from "../types/user";
import type { User as FirebaseUser } from "firebase/auth";

const USERS_COL = "users";

/** Map a Firestore document snapshot to a UserProfile. */
function mapUserDoc(data: Record<string, unknown>): UserProfile {
  return {
    uid: data.uid as string,
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: (data.photoURL as string) ?? null,
    role: (data.role as UserProfile["role"]) ?? "user",
    status: (data.status as UserProfile["status"]) ?? "active",
    username: (data.username as string) ?? "",
    uploadCount: (data.uploadCount as number) ?? 0,
    createdAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.createdAt as any)?.toDate?.() ?? new Date(),
    lastLoginAt:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data.lastLoginAt as any)?.toDate?.() ?? new Date(),
  };
}

/** Fetch a user profile from Firestore. Returns null if not found. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return null;
  return mapUserDoc(snap.data());
}

/**
 * Create or update a Firestore user profile on login.
 * - First login: creates the document with default role & status.
 * - Subsequent logins: updates lastLoginAt and syncs Auth fields.
 */
export async function upsertUserProfile(
  firebaseUser: FirebaseUser,
): Promise<UserProfile> {
  const ref = doc(db, USERS_COL, firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First login — create user document
    const newProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName ?? "",
      photoURL: firebaseUser.photoURL ?? null,
      role: "user",
      status: "active",
      username: "",
      uploadCount: 0,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(ref, newProfile);
    return {
      ...newProfile,
      role: "user",
      status: "active",
      createdAt: new Date(),
      lastLoginAt: new Date(),
    } as UserProfile;
  }

  // Returning user — update lastLoginAt and sync Auth fields
  await updateDoc(ref, {
    lastLoginAt: serverTimestamp(),
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName ?? "",
    photoURL: firebaseUser.photoURL ?? null,
  });

  return mapUserDoc({
    ...snap.data(),
    lastLoginAt: new Date(),
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName ?? "",
    photoURL: firebaseUser.photoURL ?? null,
  });
}
