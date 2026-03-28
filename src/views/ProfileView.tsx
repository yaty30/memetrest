import { Box, Typography, CircularProgress } from "@mui/material";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import type { UserProfile } from "../types/user";

interface ProfileViewProps {
  profile: UserProfile | null;
  loading: boolean;
  isOwnProfile: boolean;
  notFound: boolean;
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
}: ProfileViewProps) {
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
    return (
      <StatusPane
        icon={<LockOutlinedIcon sx={{ fontSize: 44 }} />}
        title="Sign in to view your profile"
        subtitle="Create an account or sign in to get started."
      />
    );
  }

  return (
    <Box>
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
      <ProfileTabs profile={profile} isOwnProfile={isOwnProfile} />
    </Box>
  );
}
