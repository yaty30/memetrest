import { useState } from "react";
import {
  Box,
  IconButton,
  Drawer,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import NavBrand from "./NavBrand";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";

export default function AppNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      component="nav"
      sx={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={(theme) => ({
          width: "100%",
          backgroundColor: "surface.glass",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "18px",
          border: `1px solid ${theme.palette.surface.glassBorder}`,
          boxShadow: theme.palette.customShadows.elevated,
          px: { xs: 2, sm: 3 },
          py: { xs: 1, sm: 1.25 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          transition: "box-shadow 0.3s ease",
        })}
      >
        {/* Left: Brand */}
        <NavBrand />

        {/* Center: Nav links — desktop only */}
        {!isMobile && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <NavLinks />
          </Box>
        )}

        {/* Right: User menu + hamburger */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <UserMenu />
          {isMobile && (
            <IconButton
              onClick={() => setDrawerOpen(true)}
              size="small"
              sx={{ ml: 0.5, color: "text.secondary" }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: "18px 0 0 18px",
            p: 2,
            pt: 3,
            backgroundColor: "surface.drawer",
            backdropFilter: "blur(16px)",
          },
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <NavBrand />
            <IconButton onClick={() => setDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
          <NavLinks
            direction="column"
            onItemClick={() => setDrawerOpen(false)}
          />
        </Stack>
      </Drawer>
    </Box>
  );
}
