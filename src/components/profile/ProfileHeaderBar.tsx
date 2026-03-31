import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { UserProfile } from "../../types/user";
import { AVATAR_RING, AVATAR_SIZE, pillBtnSx } from "./ProfileHeader.constants";

interface ProfileHeaderBarProps {
  profile: UserProfile;
  uploadCount: number;
  uploadCountLoading: boolean;
  uploadCountError: string | null;
  name: string;
  initials: string;
  isOwnProfile: boolean;
  avatarError: boolean;
  onAvatarError: () => void;
  onChangeAvatar: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
  collapseProgress?: number;
}

/* ── Shared sub-components ───────────────────────────────── */

function AvatarBlock({
  profile,
  name,
  initials,
  isOwnProfile,
  avatarError,
  onAvatarError,
  onChangeAvatar,
}: Pick<
  ProfileHeaderBarProps,
  | "profile"
  | "name"
  | "initials"
  | "isOwnProfile"
  | "avatarError"
  | "onAvatarError"
  | "onChangeAvatar"
>) {
  return (
    <Box
      sx={{
        position: "relative",
        ...(isOwnProfile && {
          "&:hover .avatar-edit-btn": { opacity: 1 },
          "& .avatar-edit-btn:focus": { opacity: 1 },
        }),
      }}
    >
      <Avatar
        variant="rounded"
        src={avatarError ? undefined : profile.avatar?.url}
        alt={name}
        slotProps={{ img: { onError: onAvatarError } }}
        sx={(theme) => ({
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          overflow: "hidden",
          borderRadius: 1,
          clipPath: "polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)",
          border: `${AVATAR_RING}px solid ${alpha(theme.palette.background.paper, 0.5)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.15),
          fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.7rem" },
          fontWeight: 700,
          color: "primary.main",
          boxShadow: `0 4px 16px ${alpha("#000", 0.45)}, 0 0 0 1px ${alpha("#fff", 0.06)}`,
          "& img": {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            clipPath: "polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)",
          },
        })}
      >
        {initials || "?"}
      </Avatar>

      {isOwnProfile && (
        <IconButton
          className="avatar-edit-btn"
          size="small"
          onClick={onChangeAvatar}
          aria-label="Change avatar"
          sx={(theme) => ({
            position: "absolute",
            bottom: -2,
            right: -4,
            width: { xs: 26, md: 30 },
            height: { xs: 26, md: 30 },
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            border: `2px solid ${alpha(theme.palette.background.paper, 0.6)}`,
            borderRadius: "8px",
            color: "text.primary",
            opacity: { xs: 1, sm: 0 },
            transition: "opacity 0.15s",
            "&:hover": { bgcolor: theme.palette.background.paper },
          })}
        >
          <CameraAltOutlinedIcon sx={{ fontSize: { xs: 14, md: 16 } }} />
        </IconButton>
      )}
    </Box>
  );
}

function ActionRow({
  isOwnProfile,
  onEditProfile,
  onShareProfile,
  mobile,
}: {
  isOwnProfile: boolean;
  onEditProfile: () => void;
  onShareProfile: () => void;
  mobile?: boolean;
}) {
  if (!isOwnProfile) return null;
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ mt: mobile ? { xs: 1.5 } : { sm: 1.75, md: 2 } }}
    >
      <Button
        variant="outlined"
        size="small"
        startIcon={<EditOutlinedIcon />}
        onClick={onEditProfile}
        sx={{
          ...pillBtnSx,
          ...(mobile && {
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            bgcolor: "rgba(0,0,0,0.3)",
          }),
        }}
      >
        Edit Profile
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ShareOutlinedIcon />}
        onClick={onShareProfile}
        sx={{
          ...pillBtnSx,
          borderColor: "divider",
          color: "text.secondary",
          "&:hover": { borderColor: "text.secondary" },
          ...(mobile && {
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            bgcolor: "rgba(0,0,0,0.3)",
          }),
        }}
      >
        Share
      </Button>
    </Stack>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function ProfileHeaderBar({
  profile,
  uploadCount,
  uploadCountLoading,
  uploadCountError,
  name,
  initials,
  isOwnProfile,
  avatarError,
  onAvatarError,
  onChangeAvatar,
  onEditProfile,
  onShareProfile,
  collapseProgress = 0,
}: ProfileHeaderBarProps) {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up("sm"));
  const contentOpacity = Math.max(0, 1 - collapseProgress * 1.35);

  const uploadDisplay = uploadCountLoading
    ? "…"
    : uploadCountError
      ? "--"
      : uploadCount;

  const joinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;

  /* ─── Desktop: 3-column row ─── */
  if (smUp) {
    return (
      <Box
        sx={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { sm: 3, md: 5 },
          mt: {
            sm: `-${Math.round(AVATAR_SIZE.sm / 2)}px`,
            md: `-${Math.round(AVATAR_SIZE.md / 2)}px`,
          },
          px: { sm: 3, md: 4 },
          opacity: contentOpacity,
          transform: `translateY(-${Math.round(collapseProgress * 20)}px)`,
          transition: "opacity 180ms ease, transform 220ms ease",
          pointerEvents: contentOpacity > 0.05 ? "auto" : "none",
        }}
      >
        {/* Left column — stats */}
        <Box
          sx={{
            flex: "1 1 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 0.25,
          }}
        >
          <Typography
            sx={{
              fontSize: { sm: "0.88rem", md: "0.92rem" },
              color: "text.secondary",
              fontWeight: 500,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {uploadDisplay} uploads&nbsp;&middot;&nbsp;
            {profile.savedCount ?? 0} saved
          </Typography>

          <ActionRow
            isOwnProfile={isOwnProfile}
            onEditProfile={onEditProfile}
            onShareProfile={onShareProfile}
          />
        </Box>

        {/* Center — avatar + name */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <AvatarBlock
            profile={profile}
            name={name}
            initials={initials}
            isOwnProfile={isOwnProfile}
            avatarError={avatarError}
            onAvatarError={onAvatarError}
            onChangeAvatar={onChangeAvatar}
          />
          <Typography
            noWrap
            sx={{
              mt: 1.25,
              fontWeight: 700,
              fontSize: { sm: "1.15rem", md: "1.3rem" },
              letterSpacing: "-0.01em",
              color: "text.primary",
              lineHeight: 1.25,
              textAlign: "center",
              maxWidth: 220,
            }}
          >
            {name}
          </Typography>
        </Box>

        {/* Right column — join date */}
        <Box
          sx={{
            flex: "1 1 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {joinDate && (
            <Typography
              sx={{
                fontSize: { sm: "0.84rem", md: "0.88rem" },
                color: "text.secondary",
                fontWeight: 400,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
              }}
            >
              Joined {joinDate}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  /* ─── Mobile: stacked centered layout ─── */
  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: `-${Math.round(AVATAR_SIZE.xs / 2)}px`,
        opacity: contentOpacity,
        transform: `translateY(-${Math.round(collapseProgress * 20)}px)`,
        transition: "opacity 180ms ease, transform 220ms ease",
        pointerEvents: contentOpacity > 0.05 ? "auto" : "none",
      }}
    >
      <AvatarBlock
        profile={profile}
        name={name}
        initials={initials}
        isOwnProfile={isOwnProfile}
        avatarError={avatarError}
        onAvatarError={onAvatarError}
        onChangeAvatar={onChangeAvatar}
      />

      <Typography
        noWrap
        sx={{
          mt: 1,
          fontWeight: 700,
          fontSize: "1.05rem",
          letterSpacing: "-0.01em",
          color: "text.primary",
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: "80%",
          textShadow: "0 1px 6px rgba(0,0,0,0.6)",
        }}
      >
        {name}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          fontSize: "0.8rem",
          color: "text.secondary",
          fontWeight: 400,
          lineHeight: 1.4,
          textAlign: "center",
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }}
      >
        {uploadDisplay} uploads&nbsp;&middot;&nbsp;{profile.savedCount ?? 0}{" "}
        saved
      </Typography>

      <ActionRow
        isOwnProfile={isOwnProfile}
        onEditProfile={onEditProfile}
        onShareProfile={onShareProfile}
        mobile
      />
    </Box>
  );
}
