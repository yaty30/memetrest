import { useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  Stack,
  Button,
  Chip,
  Skeleton,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import type { UserProfile } from "../../types/user";
import { useAuth } from "../../providers/AuthProvider";
import EditProfileDialog from "./EditProfileDialog";
import AssetPickerDialog from "./AssetPickerDialog";

/* ─── Sizing tokens ─── */
// Responsive fixed heights sized to show enough of the 1582×612 banners
// without dominating the page. object-fit: cover handles the crop.
const BANNER_H = { xs: 180, sm: 260, md: 450 };
const AVATAR = { xs: 80, sm: 96, md: 112 };
const AVATAR_RING = 4;
const CONTENT_PX = { xs: 2, sm: 3, md: 5 };

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  loading?: boolean;
}

function fmtJoined(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  loading,
}: ProfileHeaderProps) {
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const { refreshProfile } = useAuth();

  if (loading) return <HeaderSkeleton />;

  const name = profile.displayName || profile.authDisplayName || "Anonymous";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bannerUrl = profile.banner?.url;
  const showBanner = !!bannerUrl && !bannerError;

  return (
    <Box>
      {/* ── Banner ── */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: BANNER_H,
          overflow: "hidden",
          bgcolor: "surface.input",
          // Fallback gradient when no valid banner image
          ...(!showBanner && {
            background:
              "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(40,40,40,1) 50%, rgba(25,25,25,1) 100%)",
          }),
          // Hover state for edit overlay
          ...(isOwnProfile && {
            "&:hover .banner-edit-overlay": { opacity: 1 },
            "& .banner-edit-overlay:focus-within": { opacity: 1 },
          }),
        }}
      >
        {showBanner && (
          <Box
            component="img"
            src={bannerUrl}
            alt=""
            onError={() => setBannerError(true)}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {/* Bottom fade — keeps avatar/text readable */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: showBanner
              ? "linear-gradient(0deg, rgba(27,27,27,0.85) 0%, rgba(27,27,27,0.3) 40%, transparent 70%)"
              : "linear-gradient(0deg, rgba(27,27,27,0.7) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Banner edit overlay (own profile only) */}
        {isOwnProfile && (
          <Box
            className="banner-edit-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              p: 1.5,
              bgcolor: "rgba(0,0,0,0.35)",
              opacity: { xs: 1, sm: 0 },
              transition: "opacity 0.2s",
              zIndex: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={() => setBannerPickerOpen(true)}
              aria-label="Change banner"
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.background.paper, 0.75),
                backdropFilter: "blur(6px)",
                color: "text.primary",
                "&:hover": {
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                },
                width: 34,
                height: 34,
              })}
            >
              <CameraAltOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* ── Info region ── */}
      <Box
        sx={{
          px: CONTENT_PX,
          mt: { xs: "-40px", sm: "-48px", md: "-56px" },
          pb: { xs: 2, sm: 2.5 },
          position: "relative",
          zIndex: 3,
        }}
      >
        {/* Row: left (avatar + identity)  |  right (stats + actions) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { md: "flex-end" },
            gap: { xs: 0, md: 3 },
          }}
        >
          {/* ── Left column ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Avatar with optional edit control */}
            <Box
              sx={{
                position: "relative",
                display: "inline-block",
                ...(isOwnProfile && {
                  "&:hover .avatar-edit-btn": { opacity: 1 },
                  "& .avatar-edit-btn:focus": { opacity: 1 },
                }),
              }}
            >
              <Avatar
                src={avatarError ? undefined : profile.avatar?.url}
                alt={name}
                slotProps={{
                  img: { onError: () => setAvatarError(true) },
                }}
                sx={(theme) => ({
                  width: AVATAR,
                  height: AVATAR,
                  border: `${AVATAR_RING}px solid ${theme.palette.background.paper}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  fontSize: { xs: "1.4rem", md: "1.75rem" },
                  fontWeight: 700,
                  color: "primary.main",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                })}
              >
                {initials || "?"}
              </Avatar>

              {/* Avatar edit button */}
              {isOwnProfile && (
                <IconButton
                  className="avatar-edit-btn"
                  size="small"
                  onClick={() => setAvatarPickerOpen(true)}
                  aria-label="Change avatar"
                  sx={(theme) => ({
                    position: "absolute",
                    bottom: { xs: 2, md: 4 },
                    right: { xs: -2, md: 0 },
                    width: { xs: 26, md: 30 },
                    height: { xs: 26, md: 30 },
                    bgcolor: alpha(theme.palette.background.paper, 0.85),
                    border: `2px solid ${theme.palette.background.paper}`,
                    color: "text.primary",
                    opacity: { xs: 1, sm: 0 },
                    transition: "opacity 0.2s",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.background.paper, 1),
                    },
                  })}
                >
                  <CameraAltOutlinedIcon
                    sx={{ fontSize: { xs: 14, md: 16 } }}
                  />
                </IconButton>
              )}
            </Box>

            {/* Name + username */}
            <Box sx={{ mt: 1.25 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.25rem", sm: "1.4rem", md: "1.6rem" },
                  letterSpacing: "-0.015em",
                  color: "text.primary",
                  lineHeight: 1.3,
                }}
              >
                {name}
              </Typography>

              {profile.username ? (
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    color: "primary.main",
                    fontWeight: 500,
                    mt: 0.25,
                  }}
                >
                  @{profile.username}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: "text.disabled",
                    fontStyle: "italic",
                    mt: 0.25,
                  }}
                >
                  No username set
                </Typography>
              )}
            </Box>

            {/* Bio */}
            {profile.bio ? (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: { xs: "0.875rem", md: "0.9rem" },
                  color: "text.secondary",
                  lineHeight: 1.6,
                  maxWidth: 520,
                  whiteSpace: "pre-line",
                }}
              >
                {profile.bio}
              </Typography>
            ) : isOwnProfile ? (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: "0.8rem",
                  color: "text.disabled",
                  fontStyle: "italic",
                }}
              >
                Add a bio to tell people about yourself
              </Typography>
            ) : null}
          </Box>

          {/* ── Right column (desktop: aligned to bottom of left) ── */}
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "flex-start", md: "flex-end" },
              gap: { xs: 2, md: 1.5 },
              mt: { xs: 2.5, md: 0 },
              pb: { md: 0.25 },
            }}
          >
            {/* Stats row */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <StatChip
                icon={<CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />}
                label={`${profile.uploadCount} Uploads`}
              />
              <StatChip
                icon={<BookmarkBorderIcon sx={{ fontSize: 16 }} />}
                label={`${profile.savedCount} Saved`}
              />
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 14, color: "text.disabled" }}
                />
                <Typography
                  sx={{
                    fontSize: { xs: "0.7rem", md: "0.75rem" },
                    color: "text.disabled",
                  }}
                >
                  Joined {fmtJoined(profile.createdAt)}
                </Typography>
              </Stack>
            </Stack>

            {/* Actions */}
            {isOwnProfile && (
              <>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditOutlinedIcon />}
                    onClick={() => setEditOpen(true)}
                    sx={pillBtnSx}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ShareOutlinedIcon />}
                    onClick={() =>
                      navigator.clipboard.writeText(window.location.href)
                    }
                    sx={{
                      ...pillBtnSx,
                      borderColor: "divider",
                      color: "text.secondary",
                      "&:hover": { borderColor: "text.secondary" },
                    }}
                  >
                    Share
                  </Button>
                </Stack>

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
        </Box>
      </Box>
    </Box>
  );
}

/* ── Shared styles ── */

const pillBtnSx = {
  textTransform: "none",
  borderRadius: "999px",
  fontWeight: 600,
  fontSize: { xs: "0.8rem", md: "0.8125rem" },
  px: { xs: 2, md: 2.5 },
  py: 0.5,
} as const;

function StatChip({
  icon,
  label,
}: {
  icon: React.ReactElement;
  label: string;
}) {
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      variant="outlined"
      sx={{
        borderColor: "divider",
        color: "text.secondary",
        fontWeight: 600,
        fontSize: { xs: "0.7rem", md: "0.75rem" },
        height: { xs: 26, md: 28 },
        "& .MuiChip-icon": { color: "text.secondary" },
      }}
    />
  );
}

/* ── Skeleton ── */

function HeaderSkeleton() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        sx={{ width: "100%", height: BANNER_H }}
      />
      <Box
        sx={{
          px: CONTENT_PX,
          mt: { xs: "-40px", sm: "-48px", md: "-56px" },
          pb: 2.5,
        }}
      >
        <Skeleton variant="circular" sx={{ width: AVATAR, height: AVATAR }} />
        <Skeleton variant="text" sx={{ mt: 1.25, width: 180, height: 28 }} />
        <Skeleton variant="text" sx={{ width: 110, height: 18 }} />
        <Skeleton
          variant="text"
          sx={{ mt: 1, width: "60%", maxWidth: 360, height: 18 }}
        />
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Skeleton
            variant="rounded"
            sx={{ width: 96, height: 24, borderRadius: "999px" }}
          />
          <Skeleton
            variant="rounded"
            sx={{ width: 76, height: 24, borderRadius: "999px" }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
