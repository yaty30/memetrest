import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { onAuthChange } from "../services/authService";
import {
  getUserProfile,
  subscribeToUserProfile,
  upsertUserProfile,
} from "../services/userService";
import { useAppDispatch } from "../store/hooks";
import {
  clearCurrentUserProfile,
  profileHydrated,
  profileHydrationFailed,
  profileHydrationStarted,
  profileMissing,
} from "../store/currentUserProfileSlice";
import type { Unsubscribe } from "firebase/firestore";

interface AuthContextValue {
  /** Firebase Auth user — null when signed out, undefined while loading. */
  firebaseUser: FirebaseUser | null | undefined;
  /** True while auth and current-user profile hydration are in progress. */
  loading: boolean;
  /** Force-refresh the current profile document. */
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
  const dispatch = useAppDispatch();
  const [firebaseUser, setFirebaseUser] = useState<
    FirebaseUser | null | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const profileUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const authEventIdRef = useRef(0);

  useEffect(() => {
    const nextAuthEventIdOnCleanup = authEventIdRef.current + 1;

    const stopActiveProfileSubscription = () => {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
    };

    const unsubscribe = onAuthChange(async (user) => {
      const authEventId = ++authEventIdRef.current;
      stopActiveProfileSubscription();
      setFirebaseUser(user);

      if (!user) {
        dispatch(clearCurrentUserProfile());
        setLoading(false);
        return;
      }

      setLoading(true);
      dispatch(profileHydrationStarted(user.uid));

      try {
        await upsertUserProfile(user);

        if (authEventId !== authEventIdRef.current) return;

        profileUnsubscribeRef.current = subscribeToUserProfile(
          user.uid,
          (profile) => {
            if (authEventId !== authEventIdRef.current) return;

            if (!profile) {
              dispatch(profileMissing(user.uid));
              setLoading(false);
              return;
            }

            dispatch(profileHydrated({ uid: user.uid, profile }));
            setLoading(false);
          },
          (err) => {
            if (authEventId !== authEventIdRef.current) return;
            dispatch(
              profileHydrationFailed({
                uid: user.uid,
                error: err.message || "Failed to subscribe to profile",
              }),
            );
            setLoading(false);
          },
        );
      } catch (err) {
        if (authEventId !== authEventIdRef.current) return;
        console.error("Failed to hydrate current user profile:", err);
        dispatch(
          profileHydrationFailed({
            uid: user.uid,
            error:
              err instanceof Error ? err.message : "Failed to hydrate profile",
          }),
        );
        setLoading(false);
      }
    });

    return () => {
      authEventIdRef.current = nextAuthEventIdOnCleanup;
      stopActiveProfileSubscription();
      unsubscribe();
    };
  }, [dispatch]);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;

    dispatch(profileHydrationStarted(firebaseUser.uid));
    try {
      await upsertUserProfile(firebaseUser);
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) {
        dispatch(profileHydrated({ uid: firebaseUser.uid, profile }));
      } else {
        dispatch(profileMissing(firebaseUser.uid));
      }
    } catch (err) {
      dispatch(
        profileHydrationFailed({
          uid: firebaseUser.uid,
          error:
            err instanceof Error ? err.message : "Failed to refresh profile",
        }),
      );
    }
  }, [dispatch, firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ firebaseUser, loading, refreshProfile }),
    [firebaseUser, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
