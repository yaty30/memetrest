import { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import type { UserProfile } from "../types/user";
import { getUserByUsername } from "../services/userService";
import { useAppSelector } from "../store/hooks";

interface ProfileData {
  profile: UserProfile | null;
  loading: boolean;
  isOwnProfile: boolean;
  notFound: boolean;
  signedIn: boolean;
  profileError: string | null;
}

/**
 * Loads profile data for the profile page.
 * - No username param → shows the signed-in user's own profile from auth context.
 * - Username that matches own → same as above (no extra fetch).
 * - Other username → fetches from Firestore via the usernames collection.
 */
export function useProfileData(username?: string): ProfileData {
  const { firebaseUser, loading: authLoading, refreshProfile } = useAuth();
  const {
    profile: currentUserProfile,
    status: currentProfileStatus,
    error: currentProfileError,
  } = useAppSelector((state) => state.currentUserProfile);
  const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(
    null,
  );
  const [fetchLoading, setFetchLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const ownProfileRetryUidRef = useRef<string | null>(null);

  const isOwnProfile =
    !username ||
    (!!currentUserProfile?.username &&
      currentUserProfile.username === username);

  const awaitingOwnProfileResolution =
    !!username &&
    !!firebaseUser &&
    !isOwnProfile &&
    (authLoading ||
      currentProfileStatus === "loading" ||
      currentProfileStatus === "idle");

  useEffect(() => {
    if (!username || isOwnProfile || awaitingOwnProfileResolution) return;

    let cancelled = false;
    setFetchedProfile(null);
    setFetchLoading(true);
    setNotFound(false);

    getUserByUsername(username)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setFetchedProfile(p);
        } else {
          setNotFound(true);
        }
        setFetchLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setFetchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username, isOwnProfile, awaitingOwnProfileResolution]);

  useEffect(() => {
    if (username) return;
    if (!firebaseUser || currentUserProfile) {
      ownProfileRetryUidRef.current = null;
      return;
    }
    if (currentProfileStatus !== "error") return;
    if (ownProfileRetryUidRef.current === firebaseUser.uid) return;

    ownProfileRetryUidRef.current = firebaseUser.uid;
    void refreshProfile();
  }, [
    currentProfileStatus,
    currentUserProfile,
    firebaseUser,
    refreshProfile,
    username,
  ]);

  if (!username || isOwnProfile) {
    // If the profile is already hydrated in Redux, return it immediately
    // without waiting for auth to re-settle. Banner, avatar, name, bio etc.
    // are already cached — no need to block the view with a spinner.
    const profileReady =
      currentProfileStatus === "ready" && !!currentUserProfile;
    const currentUserLoading = profileReady
      ? false
      : authLoading ||
        (!!firebaseUser &&
          (currentProfileStatus === "loading" ||
            currentProfileStatus === "idle"));

    return {
      profile: currentUserProfile,
      loading: currentUserLoading,
      isOwnProfile: true,
      notFound: false,
      signedIn: !!firebaseUser,
      profileError:
        !!firebaseUser && currentProfileStatus === "error"
          ? currentProfileError ?? "Failed to load profile"
          : null,
    };
  }

  if (awaitingOwnProfileResolution) {
    return {
      profile: null,
      loading: true,
      isOwnProfile: false,
      notFound: false,
      signedIn: !!firebaseUser,
      profileError: null,
    };
  }

  return {
    profile: fetchedProfile,
    loading: fetchLoading,
    isOwnProfile: false,
    notFound,
    signedIn: !!firebaseUser,
    profileError: null,
  };
}
