import { Box, Typography } from "@mui/material";

/** Small "GIF" pill badge for the top-left corner of meme cards. */
export default function GifBadge() {
  return (
    <Box
      sx={{
        bgcolor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        borderRadius: "10px",
        px: 0.85,
        py: 0.2,
        lineHeight: 1,
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "#fff",
          lineHeight: 1.4,
        }}
      >
        GIF
      </Typography>
    </Box>
  );
}
