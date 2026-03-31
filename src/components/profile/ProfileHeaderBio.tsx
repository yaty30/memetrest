import { Box, Typography } from "@mui/material";
import { BAR_WIDTH } from "./ProfileHeader.constants";

interface ProfileHeaderBioProps {
  bio?: string;
  isOwnProfile: boolean;
  collapseProgress?: number;
}

export default function ProfileHeaderBio({
  bio,
  isOwnProfile,
  collapseProgress = 0,
}: ProfileHeaderBioProps) {
  if (!bio && !isOwnProfile) return null;

  return (
    <Box
      sx={{
        width: BAR_WIDTH,
        mx: "auto",
        px: { xs: 1.5, sm: 2, md: 3 },
        pt: 0.75,
        pb: 0.25,
        maxHeight: `${Math.round(76 * (1 - collapseProgress))}px`,
        opacity: Math.max(0, 1 - collapseProgress * 1.6),
        transform: `translateY(-${Math.round(collapseProgress * 8)}px)`,
        overflow: "hidden",
        transition: "max-height 200ms ease, opacity 160ms ease, transform 200ms ease",
      }}
    >
      {bio ? (
        <Typography
          sx={{
            fontSize: { xs: "0.82rem", md: "0.88rem" },
            color: "text.secondary",
            lineHeight: 1.55,
            maxWidth: 560,
            whiteSpace: "pre-line",
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          {bio}
        </Typography>
      ) : (
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: "text.disabled",
            fontStyle: "italic",
            my: 2.4,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          Add a bio to tell people about yourself
        </Typography>
      )}
    </Box>
  );
}
