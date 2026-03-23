import { createTheme, type Theme } from "@mui/material/styles";
import { darkPalette } from "./palette";

const typography = {
  fontFamily: "'Google Sans', 'Inter', system-ui, -apple-system, sans-serif",
  h6: {
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  body1: {
    fontSize: "0.9375rem",
    lineHeight: 1.6,
  },
  body2: {
    fontSize: "0.8125rem",
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
};

export function createAppTheme(_mode: "light" | "dark"): Theme {
  return createTheme({
    palette: darkPalette,
    typography,
    shape: { borderRadius: 10 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none" as const,
            borderRadius: 10,
            fontWeight: 600,
            fontSize: "0.8125rem",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            backgroundImage: "none",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: "14px !important",
            boxShadow: theme.palette.customShadows.menu,
            border: `1px solid ${theme.palette.action.hover}`,
            backgroundImage: "none",
          }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            fontWeight: 500,
            borderRadius: 8,
            margin: "2px 6px",
            padding: "8px 12px",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            backgroundImage: "none",
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: theme.palette.customShadows.fab,
          }),
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.surface.input,
          }),
        },
      },
    },
  });
}
