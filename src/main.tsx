import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppThemeProvider } from "./providers/ThemeProvider";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
