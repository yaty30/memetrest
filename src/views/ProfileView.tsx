import { useCallback, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ProfileHeader } from "../components/profile";
import ProfileTabs from "../components/profile/ProfileTabs";
import { useUserUploads } from "../hooks/useUserUploads";
import { getProfileVisibleUploadCount } from "../services/uploadSummary";
import type { UserProfile } from "../types/user";

interface ProfileViewProps {
  profile: UserProfile | null;
  loading: boolean;
  isOwnProfile: boolean;
  notFound: boolean;
  signedIn: boolean;
  profileError: string | null;
  onBack?: () => void;
}

/** Centered status state used for loading / not-found / sign-in. */
function StatusPane({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 10, sm: 14 },
        gap: 1.5,
        textAlign: "center",
        px: 3,
      }}
    >
      {icon && (
        <Box sx={{ color: "text.disabled", opacity: 0.5, mb: 0.5 }}>{icon}</Box>
      )}
      <Typography
        sx={{ fontWeight: 600, fontSize: "1.125rem", color: "text.primary" }}
      >
        {title}
      </Typography>
      <Typography
        sx={{ fontSize: "0.8125rem", color: "text.secondary", maxWidth: 360 }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

export default function ProfileView({
  profile,
  loading,
  isOwnProfile,
  notFound,
  signedIn,
  profileError,
  onBack,
}: ProfileViewProps) {
  const [headerCollapse] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTabScroll = useCallback((_scrollTop: number) => {
    // Collapsing header feature suppressed for now
  }, []);

  const {
    totalCount,
    publishedCount,
    loading: uploadsLoading,
    error: uploadsError,
  } = useUserUploads(profile?.uid, {
    visibility: isOwnProfile ? "owner" : "public",
  });

  const visibleUploadCount = getProfileVisibleUploadCount(
    {
      totalCount,
      publishedCount,
    },
    isOwnProfile,
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: { xs: 10, sm: 14 },
        }}
      >
        <CircularProgress size={28} sx={{ color: "text.disabled" }} />
      </Box>
    );
  }

  if (notFound) {
    return (
      <StatusPane
        icon={<PersonOffOutlinedIcon sx={{ fontSize: 44 }} />}
        title="User not found"
        subtitle="This profile doesn't exist or may have been removed."
      />
    );
  }

  if (!profile) {
    if (signedIn) {
      return (
        <StatusPane
          icon={<PersonOffOutlinedIcon sx={{ fontSize: 44 }} />}
          title="We couldn't load your profile"
          subtitle={
            profileError
              ? `Signed in, but profile hydration failed: ${profileError}`
              : "Signed in, but your profile is not available right now. Please refresh and try again."
          }
        />
      );
    }

    return (
      <StatusPane
        icon={<LockOutlinedIcon sx={{ fontSize: 44 }} />}
        title="Sign in to view your profile"
        subtitle="Create an account or sign in to get started."
      />
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        uploadCount={visibleUploadCount}
        uploadCountLoading={uploadsLoading}
        uploadCountError={uploadsError}
        onBack={onBack}
        collapseProgress={headerCollapse}
      />
      <ProfileTabs
        profile={profile}
        isOwnProfile={isOwnProfile}
        onContentScroll={handleTabScroll}
      />
    </Box>
  );
}
