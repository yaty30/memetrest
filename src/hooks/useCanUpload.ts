import { useAuth } from "../providers/AuthProvider";

interface UploadPermission {
  allowed: boolean;
  reason?: string;
}

/**
 * Check whether the current user is allowed to upload.
 * Upload requires: authenticated + status === "active".
 */
export function useCanUpload(): UploadPermission {
  const { firebaseUser, userProfile, loading } = useAuth();

  if (loading) return { allowed: false, reason: "Loading..." };
  if (!firebaseUser) return { allowed: false, reason: "Sign in to upload" };
  if (!userProfile) return { allowed: false, reason: "Profile not loaded" };
  if (userProfile.status !== "active") {
    return { allowed: false, reason: "Your account is not active" };
  }

  return { allowed: true };
}
