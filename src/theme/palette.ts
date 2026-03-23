import type { PaletteOptions } from "@mui/material/styles";

/* ─── Custom palette type augmentation ─── */
declare module "@mui/material/styles" {
  interface Palette {
    surface: {
      glass: string;
      glassBorder: string;
      container: string;
      drawer: string;
      card: string;
      input: string;
      inputHover: string;
      inputFocus: string;
    };
    overlay: {
      text: string;
      textSecondary: string;
      textShadow: string;
      glassButton: string;
      glassButtonHover: string;
      backdrop: string;
    };
    scrollbar: {
      thumb: string;
      thumbHover: string;
    };
    gradient: {
      body: string;
      viewer: string;
      cardOverlay: string;
    };
    status: {
      online: string;
    };
    customShadows: {
      card: string;
      cardHover: string;
      elevated: string;
      container: string;
      viewer: string;
      menu: string;
      dropdown: string;
      fab: string;
      fabHover: string;
    };
  }
  interface PaletteOptions {
    surface?: {
      glass?: string;
      glassBorder?: string;
      container?: string;
      drawer?: string;
      card?: string;
      input?: string;
      inputHover?: string;
      inputFocus?: string;
    };
    overlay?: {
      text?: string;
      textSecondary?: string;
      textShadow?: string;
      glassButton?: string;
      glassButtonHover?: string;
      backdrop?: string;
    };
    scrollbar?: {
      thumb?: string;
      thumbHover?: string;
    };
    gradient?: {
      body?: string;
      viewer?: string;
      cardOverlay?: string;
    };
    status?: {
      online?: string;
    };
    customShadows?: {
      card?: string;
      cardHover?: string;
      elevated?: string;
      container?: string;
      viewer?: string;
      menu?: string;
      dropdown?: string;
      fab?: string;
      fabHover?: string;
    };
  }
}

// Accent color used across the dark theme for highlights,
// active states, and interactive elements.
export const ACCENT = "#5EEAD4";

export const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: ACCENT,
    light: "#99F6E4",
    dark: "#2DD4BF",
    contrastText: "#1A1A1A",
  },
  secondary: {
    main: "#6B7280",
    light: "#9CA3AF",
    dark: "#4B5563",
    contrastText: "#F5F5F5",
  },
  background: {
    default: "#323232",
    paper: "#1b1b1b",
  },
  text: {
    primary: "#F0F0F0",
    secondary: "#9CA3AF",
  },
  divider: "rgba(255,255,255,0.1)",

  /* ─── Custom semantic tokens ─── */

  surface: {
    glass: "rgba(15, 15, 15, 0.87)",
    glassBorder: "rgba(10, 10, 10, 0.08)",
    container: "rgba(20, 20, 20, 0.6)",
    drawer: "rgba(20, 20, 20, 0.95)",
    card: "#1a1a1a",
    input: "rgba(255,255,255,0.06)",
    inputHover: "rgba(255,255,255,0.08)",
    inputFocus: "#303030",
  },

  overlay: {
    text: "#fff",
    textSecondary: "rgba(255, 255, 255, 0.8)",
    textShadow: "0 1px 4px rgba(0, 0, 0, 0.25)",
    glassButton: "rgba(255, 255, 255, 0.25)",
    glassButtonHover: "rgba(255, 255, 255, 0.4)",
    backdrop: "rgba(0, 0, 0, 0.6)",
  },

  scrollbar: {
    thumb: "#3a3a3a",
    thumbHover: "#4a4a4a",
  },

  gradient: {
    body: "linear-gradient(324deg, #131313, #040504, #060e0a)",
    viewer: "linear-gradient(324deg, #0a0a0a, #1a1a1a, #191919)",
    cardOverlay:
      "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
  },

  status: {
    online: "#22C55E",
  },

  customShadows: {
    card: "0 1px 4px rgba(0,0,0,0.2)",
    cardHover: "0 12px 32px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)",
    elevated: "0 1px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.15)",
    container: "0 1px 3px rgba(0,0,0,0.3), 0 8px 40px rgba(0,0,0,0.2)",
    viewer: "0 8px 40px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.15)",
    menu: "0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
    dropdown: "0 8px 24px rgba(0,0,0,0.08)",
    fab: "0 4px 20px rgba(94,234,212,0.3)",
    fabHover: "0 6px 24px rgba(94,234,212,0.4)",
  },
};
