import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { UserProfile } from "../../types/user";
import {
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

function fmtJoined(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

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
  const barVisibility = Math.max(0, 1 - collapseProgress * 1.35);
  const barMaxHeight = Math.round(220 * (1 - collapseProgress));
  const topClearance = {
    xs: `${Math.round(36 * (1 - collapseProgress))}px`,
    sm: `${Math.round(34 * (1 - collapseProgress))}px`,
    md: `${Math.round(38 * (1 - collapseProgress))}px`,
  } as const;

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        mt: {
          xs: `-${BAR_OVERLAP.xs}px`,
          sm: `-${BAR_OVERLAP.sm}px`,
          md: `-${BAR_OVERLAP.md}px`,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 4,
          ...(isOwnProfile && {
            "&:hover .avatar-edit-btn": { opacity: 1 },
            "& .avatar-edit-btn:focus": { opacity: 1 },
          }),
          transform: `translateY(calc(-10px - ${Math.round(collapseProgress * 36)}px)) scale(${1 - collapseProgress * 0.2})`,
          transformOrigin: "top center",
          transition: "transform 200ms ease",
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

      <Box
        sx={{
          width: "100%",
          maxHeight: `${Math.max(0, barMaxHeight)}px`,
          overflow: "hidden",
          transition: "max-height 220ms ease",
          mt: {
            xs: -5,
            sm: -6,
            md: -7,
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
            pt: topClearance,
            pb: { xs: 1.25, sm: 1, md: 1.25 },
            px: { xs: 1.5, sm: 2, md: 3 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.75, sm: 0 },
            opacity: barVisibility,
            transform: `translateY(-${Math.round(collapseProgress * 20)}px)`,
            transition: "opacity 180ms ease, transform 220ms ease",
            pointerEvents: barVisibility > 0.2 ? "auto" : "none",
          })}
        >
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
            <StatBlock
              value={uploadCount}
              label="Uploads"
              loading={uploadCountLoading}
              hasError={Boolean(uploadCountError)}
            />
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
    </Box>
  );
}

function StatBlock({
  value,
  label,
  loading,
  hasError,
}: {
  value: number;
  label: string;
  loading?: boolean;
  hasError?: boolean;
}) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 44 }}>
      {loading ? (
        <Skeleton
          variant="rounded"
          sx={{
            mx: "auto",
            width: { xs: 24, sm: 28 },
            height: { xs: 22, sm: 24 },
            borderRadius: "6px",
          }}
        />
      ) : (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.35rem" },
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          {hasError ? "--" : value}
        </Typography>
      )}
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
