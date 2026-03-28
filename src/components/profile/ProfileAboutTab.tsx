import { Box, Stack, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import NotesIcon from "@mui/icons-material/Notes";
import type { UserProfile } from "../../types/user";

interface ProfileAboutTabProps {
  profile: UserProfile;
  isOwnProfile: boolean;
}

function InfoRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box sx={{ color: "text.disabled", mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.6875rem",
            color: "text.disabled",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: muted ? "text.disabled" : "text.primary",
            fontStyle: muted ? "italic" : "normal",
            whiteSpace: "pre-line",
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function ProfileAboutTab({
  profile,
  isOwnProfile,
}: ProfileAboutTabProps) {
  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <InfoRow
        icon={<BadgeOutlinedIcon sx={{ fontSize: 20 }} />}
        label="Display Name"
        value={profile.displayName || profile.authDisplayName || "Not set"}
        muted={!profile.displayName && !profile.authDisplayName}
      />
      <InfoRow
        icon={<AlternateEmailIcon sx={{ fontSize: 20 }} />}
        label="Username"
        value={
          profile.username
            ? `@${profile.username}`
            : isOwnProfile
              ? "No username set"
              : "Not set"
        }
        muted={!profile.username}
      />
      <InfoRow
        icon={<NotesIcon sx={{ fontSize: 20 }} />}
        label="Bio"
        value={profile.bio || (isOwnProfile ? "No bio yet" : "No bio")}
        muted={!profile.bio}
      />
      <InfoRow
        icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 20 }} />}
        label="Joined"
        value={profile.createdAt.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      />
    </Stack>
  );
}
