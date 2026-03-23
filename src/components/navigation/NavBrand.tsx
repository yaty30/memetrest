import { Stack, Typography } from "@mui/material";
import iconSrc from "../../assets/icon.png";

export default function NavBrand() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ flexShrink: 0 }}
    >
      <img
        src={iconSrc}
        alt="Memetrest logo"
        width={28}
        height={28}
        style={{ objectFit: "contain" }}
      />
      <Typography
        variant="h6"
        sx={{
          fontFamily: "'Indie Flower', cursive",
          fontWeight: 700,
          fontSize: "1.2rem",
          color: "#1A1625",
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: "-0.01em",
        }}
      >
        memetrest
      </Typography>
    </Stack>
  );
}
