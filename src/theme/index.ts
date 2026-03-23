import { createTheme, type Theme } from "@mui/material/styles";
import { lightPalette, darkPalette } from "./palette";

const sharedTypography = {
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

const sharedComponents: Theme["components"] = {
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
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        borderRadius: 0,
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: "14px !important",
        boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.04)",
      },
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
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        boxShadow: "0 4px 20px rgba(124, 58, 237, 0.3)",
      },
    },
  },
};

export function createAppTheme(mode: "light" | "dark"): Theme {
  return createTheme({
    palette: mode === "light" ? lightPalette : darkPalette,
    typography: sharedTypography,
    shape: { borderRadius: 10 },
    components: sharedComponents,
  });
}
