import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

/** Sign in with Google via popup. */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Sign in with email and password. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Register a new account with email and password. */
export async function registerWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
