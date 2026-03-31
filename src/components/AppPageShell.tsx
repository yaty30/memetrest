import type { ReactNode } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AppNavbar from "./navigation/AppNavbar";
import {
  PAGE_CONTENT_PADDING_BOTTOM,
  PAGE_CONTENT_PADDING_TOP,
  PAGE_CONTENT_PADDING_X,
  PAGE_MAX_WIDTH,
  PAGE_NAV_PADDING_X,
} from "../pages/pageLayout";

interface AppPageShellProps {
  children: ReactNode;
  /** When provided, renders a standardized back button in the page header. */
  onBack?: () => void;
  /** Page title shown in the built-in header. Omit to skip the header. */
  title?: string;
  /** Secondary description below the title. */
  subtitle?: string;
  /** Optional elements rendered on the right side of the header row. */
  headerActions?: ReactNode;
  /** Optional className for the shell body scroller. */
  bodyClassName?: string;
}

export default function AppPageShell({
  children,
  onBack,
  title,
  subtitle,
  headerActions,
  bodyClassName,
}: AppPageShellProps) {
  const hasHeader = Boolean(title);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ─── Navbar ─── */}
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

      {/* ─── Content area ─── */}
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
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
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
          {hasHeader ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: { xs: 2, sm: 3 },
                flex: 1,
                minHeight: 0,
              }}
            >
              {/* ─── Page header ─── */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexShrink: 0,
                }}
              >
                {onBack && (
                  <IconButton
                    onClick={onBack}
                    aria-label="Go back"
                    size="small"
                    sx={(theme) => ({
                      width: 34,
                      height: 34,
                      borderRadius: "11px",
                      color: "text.secondary",
                      border: `1px solid ${theme.palette.divider}`,
                      flexShrink: 0,
                      "&:hover": {
                        color: "text.primary",
                        bgcolor: "action.hover",
                        borderColor: "text.disabled",
                      },
                    })}
                  >
                    <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                {headerActions}
              </Box>

              {/* ─── Body ─── */}
              <Box
                className={bodyClassName}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {children}
              </Box>
            </Box>
          ) : (
            // No built-in header — views manage their own interior layout.
            children
          )}
        </Box>
      </Box>
    </Box>
  );
}
