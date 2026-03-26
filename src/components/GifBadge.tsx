import { Box, Typography } from "@mui/material";

/** Small "GIF" label overlaid on animated meme cards. */
export default function GifBadge() {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 8,
        left: 8,
        bgcolor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        borderRadius: "6px",
        px: 0.75,
        py: 0.25,
        lineHeight: 1,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: "#fff",
          lineHeight: 1.4,
        }}
      >
        GIF
      </Typography>
    </Box>
  );
}
