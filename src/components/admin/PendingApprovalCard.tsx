import type { MouseEvent } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardActions,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import type { PendingApprovalItem } from "../../hooks/usePendingApprovalQueue";
import type { ApprovalAction } from "./approvalTypes";

interface PendingApprovalCardProps {
  item: PendingApprovalItem;
  busyAction: ApprovalAction | null;
  onApprove: (item: PendingApprovalItem) => void;
  onReject: (item: PendingApprovalItem) => void;
  onViewDetails: (item: PendingApprovalItem) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isGif(item: PendingApprovalItem): boolean {
  return (
    item.asset.isAnimated ||
    item.asset.kind === "gif" ||
    item.asset.mimeType.toLowerCase() === "image/gif"
  );
}

/* ── Tokens ── */
const chipSx = {
  height: 22,
  fontSize: "0.6875rem",
  "& .MuiChip-label": { px: 0.75 },
} as const;

const footerBtnSx = {
  textTransform: "none",
  fontSize: "0.8rem",
  fontWeight: 600,
  borderRadius: "10px",
  flex: 1,
  py: 0.875,
} as const;

export default function PendingApprovalCard({
  item,
  busyAction,
  onApprove,
  onReject,
  onViewDetails,
}: PendingApprovalCardProps) {
  const isBusy = busyAction !== null;
  const hasDimensions =
    item.asset.dimensions.width > 0 && item.asset.dimensions.height > 0;
  const showGif = isGif(item);
  const riskIndicators = [
    item.asset.moderation.userSensitiveFlag ? "Sensitive" : null,
    item.asset.moderation.scanResult !== "unknown"
      ? `Scan: ${item.asset.moderation.scanResult}`
      : null,
  ].filter(Boolean) as string[];

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "16px",
        borderColor: "divider",
        bgcolor: "background.default",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s, box-shadow 0.15s",
        "&:hover": {
          borderColor: "text.disabled",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)",
        },
      }}
    >
      {/* ─── Clickable card surface ─── */}
      <ButtonBase
        onClick={() => onViewDetails(item)}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          textAlign: "left",
          width: "100%",
        }}
      >
        {/* ─── Badge row ─── */}
        <Stack
          direction="row"
          spacing={0.5}
          useFlexGap
          flexWrap="wrap"
          justifyContent="center"
          sx={{ pt: 2, px: 2 }}
        >
          <Chip label="Pending" color="warning" size="small" sx={chipSx} />
          {showGif && (
            <Chip
              label="GIF"
              size="small"
              sx={{
                ...chipSx,
                bgcolor: "rgb(205, 243, 248)",
                color: "#062d3d",
                fontWeight: 700,
              }}
            />
          )}
          {!showGif && (
            <Chip
              label="Image"
              size="small"
              variant="outlined"
              sx={chipSx}
            />
          )}
          {riskIndicators.map((risk) => (
            <Chip
              key={risk}
              label={risk}
              color="error"
              size="small"
              sx={chipSx}
            />
          ))}
        </Stack>

        {/* ─── Centered media preview ─── */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            px: 2.5,
            pt: 2,
            pb: 1.5,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 280,
              aspectRatio: "1 / 1",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.3)",
              background:
                "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), " +
                "linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), " +
                "linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), " +
                "linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.previewUrl ? (
              <Box
                component="img"
                src={item.previewUrl}
                alt={item.asset.title || "Pending upload"}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <Typography sx={{ color: "text.disabled", fontSize: "0.75rem" }}>
                No preview
              </Typography>
            )}
          </Box>
        </Box>

        {/* ─── Centered title ─── */}
        <Typography
          sx={{
            fontSize: "1rem",
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: "center",
            px: 2,
          }}
          noWrap
        >
          {item.asset.title || `Untitled (${item.asset.id.slice(0, 8)})`}
        </Typography>

        {/* ─── Metadata ─── */}
        <Stack
          spacing={0.5}
          alignItems="center"
          sx={{ px: 2, pt: 0.5, pb: 2 }}
        >
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: "0.75rem",
              textAlign: "center",
            }}
          >
            {item.uploader.displayName}
            {item.uploader.username ? ` (@${item.uploader.username})` : ""}
            {" · "}
            {formatRelativeTime(item.asset.createdAt)}
          </Typography>

          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            flexWrap="wrap"
            justifyContent="center"
          >
            {hasDimensions && (
              <Chip
                label={`${item.asset.dimensions.width}×${item.asset.dimensions.height}`}
                size="small"
                variant="outlined"
                sx={chipSx}
              />
            )}
            <Chip
              label={formatFileSize(item.asset.fileSize)}
              size="small"
              variant="outlined"
              sx={chipSx}
            />
          </Stack>

          {item.asset.tags.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
            >
              {item.asset.tags.slice(0, 5).map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  sx={{ ...chipSx, bgcolor: "action.selected" }}
                />
              ))}
              {item.asset.tags.length > 5 && (
                <Typography
                  sx={{
                    color: "text.disabled",
                    fontSize: "0.6875rem",
                    alignSelf: "center",
                  }}
                >
                  +{item.asset.tags.length - 5}
                </Typography>
              )}
            </Stack>
          )}
        </Stack>
      </ButtonBase>

      {/* ─── Footer actions ─── */}
      <Divider />
      <CardActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={(e) => {
            stop(e);
            onReject(item);
          }}
          disabled={isBusy}
          startIcon={
            busyAction === "reject" ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <CancelOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={footerBtnSx}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={(e) => {
            stop(e);
            onApprove(item);
          }}
          disabled={isBusy}
          startIcon={
            busyAction === "approve" ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
            )
          }
          sx={footerBtnSx}
        >
          Approve
        </Button>
      </CardActions>
    </Card>
  );
}
