import { Box, Typography } from "@mui/material";
import { BAR_WIDTH } from "./ProfileHeader.constants";

interface ProfileHeaderBioProps {
  bio?: string;
  isOwnProfile: boolean;
}

export default function ProfileHeaderBio({
  bio,
  isOwnProfile,
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
