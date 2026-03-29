import { Box, Skeleton } from "@mui/material";
import {
  AVATAR_PROTRUDE,
  AVATAR_SIZE,
  BANNER_H,
  BAR_H,
  BAR_OVERLAP,
  BAR_RADIUS,
  BAR_WIDTH,
} from "./ProfileHeader.constants";

export default function ProfileHeaderSkeleton() {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        sx={{ width: "100%", height: BANNER_H }}
      />

      <Box
        sx={{
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
          sx={{
            position: "relative",
            width: BAR_WIDTH,
            minHeight: BAR_H,
            borderRadius: BAR_RADIUS,
            overflow: "hidden",
          }}
        >
          <Skeleton
            variant="rectangular"
            sx={{ width: "100%", height: "100%", minHeight: BAR_H }}
          />

          <Box
            sx={{
              position: "absolute",
              top: {
                xs: `-${AVATAR_PROTRUDE.xs}px`,
                sm: `-${AVATAR_PROTRUDE.sm}px`,
                md: `-${AVATAR_PROTRUDE.md}px`,
              },
              left: "50%",
              transform: "translateX(-50%)",
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
