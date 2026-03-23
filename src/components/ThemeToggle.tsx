import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useColorMode } from "../providers/ThemeProvider";

export default function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <Tooltip
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <IconButton
        onClick={toggleColorMode}
        color="inherit"
        aria-label="Toggle theme"
      >
        {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
