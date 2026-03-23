import { Box } from "@mui/material";
import AppNavbar from "../components/navigation/AppNavbar";
import HomeGalleryView from "../views/HomeGalleryView";

const MAX_WIDTH = 1100;

export default function HomePage() {
  return (
    <Box
      sx={{
        height: "100vh",
        backgroundColor: "#F3EFF4",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Navbar wrapper — same max-width as gallery */}
      <Box
        sx={{
          width: "100%",
          maxWidth: MAX_WIDTH,
          mx: "auto",
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 1.5, sm: 2 },
          pb: 0,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <AppNavbar />
      </Box>

      {/* Gallery panel — fills remaining height */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          maxWidth: MAX_WIDTH,
          mx: "auto",
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 1.5, sm: 2 },
          pb: { xs: 1.5, sm: 2.5 },
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            backgroundColor: "#FFFFFF",
            borderRadius: "22px",
            border: "1px solid rgba(124,58,237,0.04)",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.02), 0 8px 40px rgba(124,58,237,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <HomeGalleryView />
        </Box>
      </Box>
    </Box>
  );
}
