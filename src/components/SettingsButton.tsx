import { IconButton, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

export default function SettingsButton() {
  return (
    <IconButton
      aria-label="Settings"
      sx={{
        color: "secondary.main",
        gap: 0.5,
        borderRadius: "12px",
        px: 1.5,
        py: 1,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "surface.input",
          color: "text.primary",
        },
      }}
    >
      <SettingsIcon sx={{ fontSize: 19 }} />
      <Typography
        variant="body2"
        sx={{
          color: "inherit",
          fontSize: "0.8125rem",
          fontWeight: 500,
          display: { xs: "none", sm: "inline" },
        }}
      >
        Settings
      </Typography>
    </IconButton>
  );
}
