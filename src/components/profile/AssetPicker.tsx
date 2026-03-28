import { Box, Typography, CircularProgress, alpha } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { ProfileAsset } from "../../types/user";

interface AssetPickerProps {
  assets: ProfileAsset[];
  loading: boolean;
  selectedId: string;
  onSelect: (asset: ProfileAsset) => void;
  kind: "avatar" | "banner";
}

/** Tile size / aspect-ratio tokens per asset kind. */
const TILE = {
  avatar: { size: { xs: 64, sm: 72, md: 80 }, ratio: "1 / 1", rounded: "50%" },
  banner: {
    size: { xs: 100, sm: 120, md: 140 },
    ratio: "16 / 5",
    rounded: "8px",
  },
} as const;

export default function AssetPicker({
  assets,
  loading,
  selectedId,
  onSelect,
  kind,
}: AssetPickerProps) {
  const tile = TILE[kind];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} sx={{ color: "text.disabled" }} />
      </Box>
    );
  }

  if (assets.length === 0) {
    return (
      <Typography sx={{ color: "text.disabled", fontSize: "0.8125rem", py: 2 }}>
        No {kind} presets available.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
      }}
    >
      {assets.map((asset) => {
        const isSelected = asset.id === selectedId;
        return (
          <Box
            key={asset.id}
            onClick={() => onSelect(asset)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(asset);
              }
            }}
            aria-label={`${asset.label}${isSelected ? " (selected)" : ""}`}
            sx={(theme) => ({
              position: "relative",
              width: kind === "avatar" ? tile.size : tile.size,
              aspectRatio: tile.ratio,
              borderRadius: tile.rounded,
              overflow: "hidden",
              cursor: "pointer",
              flexShrink: 0,
              border: isSelected
                ? `3px solid ${theme.palette.primary.main}`
                : `3px solid transparent`,
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              boxShadow: isSelected
                ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
                : "none",
              "&:hover": {
                borderColor: isSelected
                  ? theme.palette.primary.main
                  : theme.palette.divider,
              },
              "&:focus-visible": {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.5)}`,
              },
            })}
          >
            <Box
              component="img"
              src={asset.url}
              alt={asset.label}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />

            {/* Selection indicator */}
            {isSelected && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.35)",
                }}
              >
                <CheckCircleIcon
                  sx={{
                    color: "primary.main",
                    fontSize: kind === "avatar" ? 28 : 32,
                  }}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
