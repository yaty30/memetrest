import { Stack, Typography } from "@mui/material";
import iconSrc from "../../assets/icon.png";
import Logo from "../Logo";

export default function NavBrand() {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ flexShrink: 0 }}
    >
      <Logo />
      <Typography
        variant="h6"
        sx={{
          fontFamily: "'Indie Flower', cursive",
          fontWeight: 700,
          fontSize: "1.2rem",
          color: "text.primary",
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
