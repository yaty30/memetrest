import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import type { UserProfile } from "../../types/user";
import AssetPickerDialog from "./AssetPickerDialog";
import EditProfileDialog from "./EditProfileDialog";
import ProfileHeaderBanner from "./ProfileHeaderBanner";
import ProfileHeaderBar from "./ProfileHeaderBar";
import ProfileHeaderBio from "./ProfileHeaderBio";
import ProfileHeaderSkeleton from "./ProfileHeaderSkeleton";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  uploadCount: number;
  uploadCountLoading: boolean;
  uploadCountError: string | null;
  collapseProgress?: number;
  loading?: boolean;
  onBack?: () => void;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  uploadCount,
  uploadCountLoading,
  uploadCountError,
  collapseProgress = 0,
  loading,
  onBack,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);

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
  const bannerExpandedHeight = mdUp ? 400 : smUp ? 180 : 140;
  const bannerCollapsedHeight = mdUp ? 132 : smUp ? 104 : 84;
  const bannerHeight =
    bannerExpandedHeight -
    (bannerExpandedHeight - bannerCollapsedHeight) * collapseProgress;

  return (
    <Box sx={{ flexShrink: 0, overflow: "hidden" }}>
      <Box
        sx={{
          height: `${Math.round(bannerHeight)}px`,
          overflow: "hidden",
          transition: "height 220ms ease",
        }}
      >
        <ProfileHeaderBanner
          bannerUrl={bannerUrl}
          showBanner={showBanner}
          isOwnProfile={isOwnProfile}
          onBack={onBack}
          onBannerError={() => setBannerError(true)}
          onChangeBanner={() => setBannerPickerOpen(true)}
        />
      </Box>

      <ProfileHeaderBar
        profile={profile}
        uploadCount={uploadCount}
        uploadCountLoading={uploadCountLoading}
        uploadCountError={uploadCountError}
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
        collapseProgress={collapseProgress}
      />

      <ProfileHeaderBio
        bio={profile.bio}
        isOwnProfile={isOwnProfile}
        collapseProgress={collapseProgress}
      />

      {isOwnProfile && (
        <>
          <EditProfileDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            profile={profile}
          />
          <AssetPickerDialog
            open={avatarPickerOpen}
            onClose={() => setAvatarPickerOpen(false)}
            profile={profile}
            kind="avatar"
          />
          <AssetPickerDialog
            open={bannerPickerOpen}
            onClose={() => setBannerPickerOpen(false)}
            profile={profile}
            kind="banner"
          />
        </>
      )}
    </Box>
  );
}
