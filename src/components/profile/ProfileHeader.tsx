import { useState } from "react";
import { Box } from "@mui/material";
import type { UserProfile } from "../../types/user";
import { useAuth } from "../../providers/AuthProvider";
import AssetPickerDialog from "./AssetPickerDialog";
import EditProfileDialog from "./EditProfileDialog";
import ProfileHeaderBanner from "./ProfileHeaderBanner";
import ProfileHeaderBar from "./ProfileHeaderBar";
import ProfileHeaderBio from "./ProfileHeaderBio";
import ProfileHeaderSkeleton from "./ProfileHeaderSkeleton";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  loading?: boolean;
  onBack?: () => void;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  loading,
  onBack,
}: ProfileHeaderProps) {
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const { refreshProfile } = useAuth();

  if (loading) return <ProfileHeaderSkeleton />;

  const name = profile.displayName || profile.authDisplayName || "Anonymous";
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bannerUrl = profile.banner?.url;
  const showBanner = Boolean(bannerUrl) && !bannerError;

  return (
    <Box>
      <ProfileHeaderBanner
        bannerUrl={bannerUrl}
        showBanner={showBanner}
        isOwnProfile={isOwnProfile}
        onBack={onBack}
        onBannerError={() => setBannerError(true)}
        onChangeBanner={() => setBannerPickerOpen(true)}
      />

      <ProfileHeaderBar
        profile={profile}
        name={name}
        initials={initials}
        isOwnProfile={isOwnProfile}
        avatarError={avatarError}
        onAvatarError={() => setAvatarError(true)}
        onChangeAvatar={() => setAvatarPickerOpen(true)}
        onEditProfile={() => setEditOpen(true)}
        onShareProfile={() =>
          navigator.clipboard.writeText(window.location.href)
        }
      />

      <ProfileHeaderBio bio={profile.bio} isOwnProfile={isOwnProfile} />

      {isOwnProfile && (
        <>
          <EditProfileDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            profile={profile}
            onSaved={refreshProfile}
          />
          <AssetPickerDialog
            open={avatarPickerOpen}
            onClose={() => setAvatarPickerOpen(false)}
            profile={profile}
            kind="avatar"
            onSaved={refreshProfile}
          />
          <AssetPickerDialog
            open={bannerPickerOpen}
            onClose={() => setBannerPickerOpen(false)}
            profile={profile}
            kind="banner"
            onSaved={refreshProfile}
          />
        </>
      )}
    </Box>
  );
}
