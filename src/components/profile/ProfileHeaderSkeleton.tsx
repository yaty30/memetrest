import { Box, Skeleton, Stack } from "@mui/material";
import { AVATAR_SIZE, BANNER_H } from "./ProfileHeader.constants";

export default function ProfileHeaderSkeleton() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        sx={{ width: "100%", height: BANNER_H }}
      />

      <Stack
        alignItems="center"
        sx={{
          mt: {
            xs: `-${Math.round(AVATAR_SIZE.xs / 2)}px`,
            sm: `-${Math.round(AVATAR_SIZE.sm / 2)}px`,
            md: `-${Math.round(AVATAR_SIZE.md / 2)}px`,
          },
        }}
      >
        <Skeleton
          variant="rounded"
          sx={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "18% 18% 24% 24%",
            clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
          }}
        />

        <Skeleton
          variant="rounded"
          sx={{
            mt: 1.25,
            width: { xs: 120, sm: 140, md: 160 },
            height: { xs: 18, sm: 20 },
            borderRadius: "6px",
          }}
        />

        <Skeleton
          variant="rounded"
          sx={{
            mt: 0.75,
            width: { xs: 100, sm: 110 },
            height: { xs: 14, sm: 15 },
            borderRadius: "6px",
          }}
        />
      </Stack>
    </Box>
  );
}
