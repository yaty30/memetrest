import { useParams } from "react-router-dom";
import { Box } from "@mui/material";
import AppNavbar from "../components/navigation/AppNavbar";
import ProfileView from "../views/ProfileView";
import { useProfileData } from "../hooks/useProfileData";

/**
 * Desktop: generous 1400px max. The container uses background.paper so it
 * lifts cleanly off the dark body gradient. On mobile the surface goes
 * full-bleed (no border-radius, no horizontal padding) so it feels native.
 */
const PAGE_MAX_WIDTH = { xs: "100%", sm: 960, md: 1280, lg: 1400 };

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { profile, loading, isOwnProfile, notFound } = useProfileData(username);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar */}
      <Box
        sx={{
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
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

      {/* Profile surface */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: { xs: 0, sm: 2.5 },
          pt: { xs: 0, sm: 2 },
          pb: { xs: 0, sm: 3 },
          boxSizing: "border-box",
        }}
      >
        <Box
          component="main"
          sx={{
            bgcolor: "background.paper",
            borderRadius: { xs: 0, sm: "14px" },
            overflow: "hidden",
            // Minimal shadow so it lifts off the body gradient on sm+
            boxShadow: {
              xs: "none",
              sm: "0 0 0 1px rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.25)",
            },
          }}
        >
          <ProfileView
            profile={profile}
            loading={loading}
            isOwnProfile={isOwnProfile}
            notFound={notFound}
          />
        </Box>
      </Box>
    </Box>
  );
}
