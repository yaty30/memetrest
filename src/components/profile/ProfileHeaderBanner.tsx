import { useEffect, useState } from "react";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BANNER_H } from "./ProfileHeader.constants";

interface ProfileHeaderBannerProps {
  bannerUrl?: string;
  showBanner: boolean;
  isOwnProfile: boolean;
  onBack?: () => void;
  onBannerError: () => void;
  onChangeBanner: () => void;
  /** When true the banner fills its parent and skips its own gradient. */
  heroMode?: boolean;
}

export default function ProfileHeaderBanner({
  bannerUrl,
  showBanner,
  isOwnProfile,
  onBack,
  onBannerError,
  onChangeBanner,
  heroMode,
}: ProfileHeaderBannerProps) {
  const [isBannerLoading, setIsBannerLoading] = useState(false);

  useEffect(() => {
    if (!showBanner || !bannerUrl) {
      setIsBannerLoading(false);
      return;
    }
    setIsBannerLoading(true);
  }, [bannerUrl, onBannerError, showBanner]);

  const hasBanner = showBanner && !!bannerUrl;
  const shouldShowBannerImage = hasBanner && !isBannerLoading;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: heroMode ? "100%" : BANNER_H,
        overflow: "hidden",
        bgcolor: "surface.input",
        opacity: showBanner ? 1 : 0.6,
        transition: "background-color 0.3s, opacity 0.3s",
        ...(!shouldShowBannerImage && {
          background:
            "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(40,40,40,1) 50%, rgba(25,25,25,1) 100%)",
        }),
        ...(!heroMode &&
          isOwnProfile && {
            "&:hover .banner-edit-overlay": { opacity: 1 },
            "& .banner-edit-overlay:focus-within": { opacity: 1 },
          }),
      }}
    >
      {hasBanner && (
        <Box
          component="img"
          src={bannerUrl}
          alt=""
          onLoad={() => setIsBannerLoading(false)}
          onError={() => {
            setIsBannerLoading(false);
            onBannerError();
          }}
          loading="eager"
          fetchPriority="high"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* Internal gradient — skipped in hero mode (parent supplies its own) */}
      {!heroMode && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: shouldShowBannerImage
              ? "linear-gradient(0deg, rgba(18,18,18,0.7) 0%, rgba(18,18,18,0.2) 40%, transparent 70%)"
              : "linear-gradient(0deg, rgba(18,18,18,0.5) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      {onBack && (
        <IconButton
          size="small"
          onClick={onBack}
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
      )}

      {isOwnProfile &&
        (heroMode ? (
          /* Hero mode: standalone camera button (no full-area overlay) */
          <IconButton
            size="small"
            onClick={onChangeBanner}
            aria-label="Change banner"
            sx={(theme) => ({
              position: "absolute",
              top: { xs: 10, sm: 12 },
              right: { xs: 10, sm: 12 },
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
            <CameraAltOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : (
          /* Desktop: hover-reveal overlay */
          <Box
            className="banner-edit-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              p: 1.5,
              bgcolor: "rgba(0,0,0,0.35)",
              opacity: { xs: 1, sm: 0 },
              transition: "opacity 0.2s",
              zIndex: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={onChangeBanner}
              aria-label="Change banner"
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.background.paper, 0.75),
                backdropFilter: "blur(6px)",
                color: "text.primary",
                "&:hover": {
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                },
                width: 32,
                height: 32,
              })}
            >
              <CameraAltOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
    </Box>
  );
}
