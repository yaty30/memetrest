import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
  GlobalStyles,
} from "@mui/material";
import { createAppTheme } from "../theme";

type ColorMode = "light" | "dark";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

const STORAGE_KEY = "memetrest-color-mode";

function getInitialMode(): ColorMode {
  return "dark";
}

// eslint-disable-next-line react-refresh/only-export-components
export function useColorMode(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode must be used within an AppThemeProvider");
  }
  return context;
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(getInitialMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable
    }
  }, [mode]);

  const toggleColorMode = useCallback(() => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setColorMode = useCallback((newMode: ColorMode) => {
    setModeState(newMode);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo<ColorModeContextValue>(
    () => ({ mode, toggleColorMode, setColorMode }),
    [mode, toggleColorMode, setColorMode],
  );

  return (
    <ColorModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={(t) => ({
            ":root": {
              "--mt-gradient-body": t.palette.gradient.body,
              "--mt-gradient-viewer": t.palette.gradient.viewer,
              "--mt-surface-card": t.palette.surface.card,
              "--mt-scrollbar-thumb": t.palette.scrollbar.thumb,
              "--mt-scrollbar-thumb-hover": t.palette.scrollbar.thumbHover,
              "--mt-overlay-text": t.palette.overlay.text,
              "--mt-overlay-text-secondary": t.palette.overlay.textSecondary,
              "--mt-overlay-text-shadow": t.palette.overlay.textShadow,
              "--mt-overlay-glass-button": t.palette.overlay.glassButton,
              "--mt-overlay-glass-button-hover":
                t.palette.overlay.glassButtonHover,
              "--mt-text-primary": t.palette.text.primary,
              "--mt-text-secondary": t.palette.text.secondary,
              "--mt-action-hover": t.palette.action.hover,
              "--mt-action-focus": t.palette.action.focus,
              "--mt-shadow-viewer": t.palette.customShadows.viewer,
            },
          })}
        />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}
