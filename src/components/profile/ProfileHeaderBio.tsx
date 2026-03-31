import { Box, Typography } from "@mui/material";

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
        maxWidth: 560,
        mx: "auto",
        px: { xs: 2, sm: 2.5, md: 3 },
        pt: { xs: 1.25, sm: 1.5 },
        pb: 0.5,
        maxHeight: `${Math.round(76 * (1 - collapseProgress))}px`,
        opacity: Math.max(0, 1 - collapseProgress * 1.6),
        transform: `translateY(-${Math.round(collapseProgress * 8)}px)`,
        overflow: "hidden",
        transition:
          "max-height 200ms ease, opacity 160ms ease, transform 200ms ease",
      }}
    >
      {bio ? (
        <Typography
          sx={{
            fontSize: { xs: "0.82rem", md: "0.88rem" },
            color: "text.secondary",
            lineHeight: 1.55,
            whiteSpace: "pre-line",
            textAlign: "center",
            textShadow: { xs: "0 1px 4px rgba(0,0,0,0.4)", sm: "none" },
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
            my: 0.75,
            textAlign: "center",
            textShadow: { xs: "0 1px 4px rgba(0,0,0,0.3)", sm: "none" },
          }}
        >
          Add a bio to tell people about yourself
        </Typography>
      )}
    </Box>
  );
}
