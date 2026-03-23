import { Fab } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function FloatingActionButton() {
  return (
    <Fab
      aria-label="Scroll down"
      sx={(theme) => ({
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "primary.main",
        color: "primary.contrastText",
        width: 44,
        height: 44,
        boxShadow: theme.palette.customShadows.fab,
        zIndex: 10,
        transition: "all 0.25s ease",
        "&:hover": {
          backgroundColor: "primary.dark",
          boxShadow: theme.palette.customShadows.fabHover,
          transform: "translateX(-50%) translateY(-2px)",
        },
      })}
    >
      <KeyboardArrowDownIcon sx={{ fontSize: 26 }} />
    </Fab>
  );
}
