import { Navigate, useNavigate } from "react-router-dom";
import { Box, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AppNavbar from "../components/navigation/AppNavbar";
import { useUserUploads } from "../hooks/useUserUploads";
import { useAuth } from "../providers/AuthProvider";
import MyUploadsView from "../views/MyUploadsView";
import {
  PAGE_CONTENT_PADDING_BOTTOM,
  PAGE_CONTENT_PADDING_TOP,
  PAGE_CONTENT_PADDING_X,
  PAGE_MAX_WIDTH,
  PAGE_NAV_PADDING_X,
} from "./pageLayout";

export default function MyUploadsPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();
  const { uploads, loading, error } = useUserUploads(firebaseUser?.uid, {
    visibility: "owner",
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  if (!authLoading && !firebaseUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar — identical to ProfilePage */}
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

      {/* Content surface — identical card to ProfilePage */}
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
          {/* Banner-style header — mirrors ProfileHeaderBanner */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              overflow: "hidden",
            }}
          >
            {/* Bottom gradient overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(0deg, rgba(18,18,18,0.5) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            {/* Back button — glass-morphism style matching ProfileHeaderBanner */}
            <IconButton
              size="small"
              onClick={handleBack}
              aria-label="Go back"
              sx={(theme) => ({
                position: "absolute",
                top: { xs: 10, sm: 12 },
                left: { xs: 10, sm: 12 },
                zIndex: 3,
                width: { xs: 30, sm: 32 },
                height: { xs: 30, sm: 32 },
                borderRadius: "10px",
                color: "text.primary",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.42),
                border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
                boxShadow: `0 6px 16px ${alpha("#000", 0.22)}`,
                transition:
                  "background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
                "&:hover": {
                  bgcolor: alpha(theme.palette.background.paper, 0.56),
                  borderColor: alpha(theme.palette.common.white, 0.2),
                  transform: "translateY(-1px)",
                },
              })}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>

            {/* Title to the right of back button */}
            <Box
              sx={{
                position: "absolute",
                top: { xs: 10, sm: 12 },
                left: { xs: 48, sm: 54 },
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: { xs: 30, sm: 32 },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  color: "text.primary",
                  lineHeight: 1.2,
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }}
              >
                My Uploads
              </Typography>
            </Box>

            {/* Subtitle + content — padded like ProfileTabs content */}
            <Box
              sx={{ px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, sm: 4 }, mt: 4 }}
            >
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.8125rem",
                  mb: 2.5,
                }}
              >
                Manage your uploaded assets. Uploads are private until reviewed
                and published.
              </Typography>

              <MyUploadsView
                items={uploads}
                loading={authLoading || loading}
                error={error}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
