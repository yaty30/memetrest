import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User as FirebaseUser } from "firebase/auth";
import type { UserProfile } from "../types/user";
import { onAuthChange } from "../services/authService";
import { upsertUserProfile } from "../services/userService";

interface AuthContextValue {
  /** Firebase Auth user — null when signed out, undefined while loading. */
  firebaseUser: FirebaseUser | null | undefined;
  /** Firestore user profile — null when signed out or not yet loaded. */
  userProfile: UserProfile | null;
  /** True while auth state is being determined on mount. */
  loading: boolean;
  /** Force-refresh the Firestore profile (e.g. after admin changes). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<
    FirebaseUser | null | undefined
  >(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await upsertUserProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.error("Failed to upsert user profile:", err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      const profile = await upsertUserProfile(firebaseUser);
      setUserProfile(profile);
    }
  }, [firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ firebaseUser, userProfile, loading, refreshProfile }),
    [firebaseUser, userProfile, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
