import { useAuth } from "../providers/AuthProvider";
import { useAppSelector } from "../store/hooks";

interface UploadPermission {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether the current user is allowed to upload.
 * Upload requires: authenticated + status === "active".
 */
export function useCanUpload(): UploadPermission {
  const { firebaseUser, loading } = useAuth();
  const { profile: userProfile, status: profileStatus } = useAppSelector(
    (state) => state.currentUserProfile,
  );

  if (loading) return { allowed: false, reason: "Loading..." };
  if (!firebaseUser) return { allowed: false, reason: "Sign in to upload" };
  if (profileStatus === "loading" || profileStatus === "idle") {
    return { allowed: false, reason: "Profile not loaded" };
  }
  if (!userProfile) return { allowed: false, reason: "Profile not loaded" };
  if (userProfile.status !== "active") {
    return { allowed: false, reason: "Your account is not active" };
  }

  return { allowed: true };
}
