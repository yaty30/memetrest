import { Box } from "@mui/material";
import AppNavbar from "../components/navigation/AppNavbar";
import HomeGalleryView from "../views/HomeGalleryView";

const MAX_WIDTHS = {
  xs: "100%",
  sm: 900,
  md: 1100,
  lg: 1300,
  xl: 1450,
};
export default function HomePage() {
  return (
    <Box
      sx={{
        height: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Navbar wrapper — same max-width as gallery */}
      <Box
        sx={{
          width: "100%",
          maxWidth: MAX_WIDTHS,
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
          maxWidth: MAX_WIDTHS,
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
          sx={(theme) => ({
            flex: 1,
            minHeight: 0,
            backgroundColor: "surface.container",
            borderRadius: "22px",
            border: `1px solid ${theme.palette.action.hover}`,
            boxShadow: theme.palette.customShadows.container,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          })}
        >
          <HomeGalleryView />
        </Box>
      </Box>
    </Box>
  );
}
