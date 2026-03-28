import { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import type { UserProfile } from "../types/user";
import { getUserByUsername } from "../services/userService";

interface ProfileData {
  profile: UserProfile | null;
  loading: boolean;
  isOwnProfile: boolean;
  notFound: boolean;
}

/**
 * Loads profile data for the profile page.
 * - No username param → shows the signed-in user's own profile from auth context.
 * - Username that matches own → same as above (no extra fetch).
 * - Other username → fetches from Firestore via the usernames collection.
 */
export function useProfileData(username?: string): ProfileData {
  const { userProfile, loading: authLoading } = useAuth();
  const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(
    null,
  );
  const [fetchLoading, setFetchLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isOwnProfile =
    !username || (!!userProfile?.username && userProfile.username === username);

  useEffect(() => {
    if (!username || isOwnProfile) return;

    let cancelled = false;
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
  }, [username, isOwnProfile]);

  if (!username || isOwnProfile) {
    return {
      profile: userProfile,
      loading: authLoading,
      isOwnProfile: true,
      notFound: false,
    };
  }

  return {
    profile: fetchedProfile,
    loading: fetchLoading,
    isOwnProfile: false,
    notFound,
  };
}
