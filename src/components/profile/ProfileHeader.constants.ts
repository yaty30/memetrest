/** Breakpoint at which the desktop bar layout activates. Change to "md" to push it higher. */
export const DESKTOP_BP = "md" as const;

export const BANNER_H = { xs: 60, sm: 180, md: 200 };
export const AVATAR_SIZE = { xs: 88, sm: 100, md: 120 };
export const AVATAR_RING = 8;
export const BAR_H = { xs: 64, sm: 80, md: 90 };
export const BAR_WIDTH = { sm: "92%", md: "88%" };
export const BAR_MAX_WIDTH = 1260;
export const BAR_RADIUS = { xs: "12px", md: "14px" };
export const BAR_OVERLAP = { xs: 32, sm: 42, md: 50 };
export const AVATAR_PROTRUDE = { xs: 28, sm: 44, md: 78 };

export const pillBtnSx = {
  textTransform: "none",
  borderRadius: "999px",
  fontWeight: 600,
  fontSize: { xs: "0.78rem", md: "0.82rem" },
  px: { xs: 1.5, md: 2 },
  py: 0.5,
  minWidth: 0,
} as const;
