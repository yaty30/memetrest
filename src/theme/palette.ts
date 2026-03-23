import type { PaletteOptions } from "@mui/material/styles";

export const lightPalette: PaletteOptions = {
  mode: "light",
  primary: {
    main: "#7C3AED",
    light: "#A78BFA",
    dark: "#6D28D9",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#A78BFA",
    light: "#C4B5FD",
    dark: "#7C3AED",
    contrastText: "#FFFFFF",
  },
  background: {
    default: "#F3EFF4",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#1A1625",
    secondary: "#6B7280",
  },
  divider: "#E8E2EE",
};

export const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#A78BFA",
    light: "#C4B5FD",
    dark: "#7C3AED",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#C4B5FD",
    light: "#DDD6FE",
    dark: "#A78BFA",
    contrastText: "#1A1625",
  },
  background: {
    default: "#110E1A",
    paper: "#1E1A2B",
  },
  text: {
    primary: "#F1F0F5",
    secondary: "#9CA3AF",
  },
  divider: "#2D2640",
};
