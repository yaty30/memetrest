import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import AppNavbar from "../components/navigation/AppNavbar";
import ProfileView from "../views/ProfileView";
import { useProfileData } from "../hooks/useProfileData";
import {
  PAGE_CONTENT_PADDING_BOTTOM,
  PAGE_CONTENT_PADDING_TOP,
  PAGE_CONTENT_PADDING_X,
  PAGE_MAX_WIDTH,
  PAGE_NAV_PADDING_X,
} from "./pageLayout";

/**
 * Home and profile share the same outer width and gutters so both pages align.
 */

export default function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { profile, loading, isOwnProfile, notFound } = useProfileData(username);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

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
          px: PAGE_NAV_PADDING_X,
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
          px: PAGE_CONTENT_PADDING_X,
          pt: PAGE_CONTENT_PADDING_TOP,
          pb: PAGE_CONTENT_PADDING_BOTTOM,
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
            "@keyframes fadeSlideIn": {
              from: { opacity: 0, transform: "translateY(-8px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
            animation: "fadeSlideIn 0.35s ease-out",
          }}
        >
          <ProfileView
            profile={profile}
            loading={loading}
            isOwnProfile={isOwnProfile}
            notFound={notFound}
            onBack={handleBack}
          />
        </Box>
      </Box>
    </Box>
  );
}
