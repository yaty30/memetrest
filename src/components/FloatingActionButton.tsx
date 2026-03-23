import { Fab } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function FloatingActionButton() {
  return (
    <Fab
      aria-label="Scroll down"
      sx={{
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#7C3AED",
        color: "#fff",
        width: 44,
        height: 44,
        boxShadow: "0 4px 20px rgba(124, 58, 237, 0.3)",
        zIndex: 10,
        transition: "all 0.25s ease",
        "&:hover": {
          backgroundColor: "#6D28D9",
          boxShadow: "0 6px 24px rgba(124, 58, 237, 0.4)",
          transform: "translateX(-50%) translateY(-2px)",
        },
      }}
    >
      <KeyboardArrowDownIcon sx={{ fontSize: 26 }} />
    </Fab>
  );
}
