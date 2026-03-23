import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";

interface LightboxImagePaneProps {
  imageSrc: string;
  title: string;
  actions?: ReactNode;
}

export default function LightboxImagePane({
  imageSrc,
  title,
  actions,
}: LightboxImagePaneProps) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#111",
        overflow: "hidden",
        flex: { xs: "none", md: "1 1 55%" },
        minHeight: { xs: 180, md: 0 },
        maxHeight: { xs: "42vh", md: "none" },
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          p: { xs: "12px", md: "16px" },
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={title}
          draggable={false}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: "10px",
            userSelect: "none",
          }}
        />
      </Box>

      {actions && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{ px: 1.5, pt: 1, pb: 1.75, flexShrink: 0 }}
        >
          {actions}
        </Stack>
      )}
    </Box>
  );
}
