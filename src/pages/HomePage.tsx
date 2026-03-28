import { Box } from "@mui/material";
import AppNavbar from "../components/navigation/AppNavbar";
import HomeGalleryView from "../views/HomeGalleryView";
import {
  PAGE_CONTENT_PADDING_BOTTOM,
  PAGE_CONTENT_PADDING_TOP,
  PAGE_CONTENT_PADDING_X,
  PAGE_MAX_WIDTH,
  PAGE_NAV_PADDING_X,
} from "./pageLayout";
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
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: PAGE_NAV_PADDING_X,
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
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: PAGE_CONTENT_PADDING_X,
          pt: PAGE_CONTENT_PADDING_TOP,
          pb: PAGE_CONTENT_PADDING_BOTTOM,
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
