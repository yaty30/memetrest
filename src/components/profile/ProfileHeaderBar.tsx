import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { UserProfile } from "../../types/user";
import {
  AVATAR_PROTRUDE,
  AVATAR_RING,
  AVATAR_SIZE,
  BAR_H,
  BAR_OVERLAP,
  BAR_RADIUS,
  BAR_WIDTH,
  pillBtnSx,
} from "./ProfileHeader.constants";

interface ProfileHeaderBarProps {
  profile: UserProfile;
  name: string;
  initials: string;
  isOwnProfile: boolean;
  avatarError: boolean;
  onAvatarError: () => void;
  onChangeAvatar: () => void;
  onEditProfile: () => void;
  onShareProfile: () => void;
}

function fmtJoined(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfileHeaderBar({
  profile,
  name,
  initials,
  isOwnProfile,
  avatarError,
  onAvatarError,
  onChangeAvatar,
  onEditProfile,
  onShareProfile,
}: ProfileHeaderBarProps) {
  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 3,
        display: "flex",
        justifyContent: "center",
        mt: {
          xs: `-${BAR_OVERLAP.xs}px`,
          sm: `-${BAR_OVERLAP.sm}px`,
          md: `-${BAR_OVERLAP.md}px`,
        },
      }}
    >
      <Box
        sx={(theme) => ({
          position: "relative",
          width: BAR_WIDTH,
          minHeight: BAR_H,
          borderRadius: BAR_RADIUS,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: "blur(14px) saturate(1.3)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 2px 16px ${alpha("#000", 0.25)}`,
          display: "flex",
          alignItems: "center",
          py: { xs: 1.25, sm: 1, md: 1.25 },
          px: { xs: 1.5, sm: 2, md: 3 },
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 0.75, sm: 0 },
        })}
      >
        <Box
          sx={{
            position: { xs: "absolute", sm: "absolute" },
            top: {
              xs: `-${AVATAR_PROTRUDE.xs}px`,
              sm: `-${AVATAR_PROTRUDE.sm}px`,
              md: `-${AVATAR_PROTRUDE.md}px`,
            },
            left: "50%",
            transform: "translateX(-50%) translateY(-24%)",
            zIndex: 4,
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
            slotProps={{
              img: {
                onError: onAvatarError,
              },
            }}
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
              boxShasdow: `0 4px 16px ${alpha("#000", 0.45)}, 0 0 0 1px ${alpha("#fff", 0.06)}`,
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

        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 2.5, md: 3 }}
          alignItems="center"
          sx={{
            order: { xs: 2, sm: 1 },
            flex: { sm: 1 },
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <StatBlock value={profile.uploadCount} label="Uploads" />
          <StatBlock value={profile.savedCount} label="Saved" />
        </Stack>

        <Box
          sx={{
            order: { xs: 1, sm: 2 },
            textAlign: "center",
            minWidth: 0,
            px: { sm: 2, md: 3 },
          }}
        >
          <Typography
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.2rem" },
              letterSpacing: "-0.01em",
              color: "text.primary",
              lineHeight: 1.25,
            }}
          >
            {name}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={{ xs: 0.5, sm: 0.75 }}
          alignItems="center"
          sx={{
            order: 3,
            flex: { sm: 1 },
            justifyContent: { xs: "center", sm: "flex-end" },
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ display: { xs: "none", sm: "flex" }, mr: 0.5 }}
          >
            <CalendarMonthOutlinedIcon
              sx={{ fontSize: 16, color: "text.disabled" }}
            />
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "text.disabled",
                whiteSpace: "nowrap",
              }}
            >
              {fmtJoined(profile.createdAt)}
            </Typography>
          </Stack>

          {isOwnProfile && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditOutlinedIcon />}
                onClick={onEditProfile}
                sx={pillBtnSx}
              >
                Edit
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
                }}
              >
                Share
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 44 }}>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.35rem" },
          color: "text.primary",
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: "0.6rem", md: "0.65rem" },
          color: "text.secondary",
          fontWeight: 500,
          lineHeight: 1.2,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
