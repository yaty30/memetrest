import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
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

function asMediaTypeLabel(item: PendingApprovalItem): string {
  if (item.asset.isAnimated || item.asset.kind === "gif") return "GIF";
  return "Image";
}

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
  const riskIndicators = [
    item.asset.moderation.userSensitiveFlag ? "Sensitive flag" : null,
    item.asset.moderation.scanResult !== "unknown"
      ? `Scan: ${item.asset.moderation.scanResult}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "14px",
        overflow: "hidden",
        bgcolor: "background.default",
      })}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 3fr)" },
          minHeight: { xs: 300, md: 260 },
        }}
      >
        <Box
          sx={(theme) => ({
            position: "relative",
            borderRight: { xs: "none", md: `1px solid ${theme.palette.divider}` },
            borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
            minHeight: { xs: 220, md: "100%" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            bgcolor: "surface.input",
          })}
        >
          {item.previewUrl ? (
            <Box
              component="img"
              src={item.previewUrl}
              alt={item.asset.title || "Pending upload preview"}
              sx={{
                width: "100%",
                height: "100%",
                maxHeight: { xs: 300, md: 380 },
                objectFit: "contain",
              }}
            />
          ) : (
            <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
              Preview unavailable
            </Typography>
          )}

          {asMediaTypeLabel(item) === "GIF" && (
            <Chip
              label="GIF"
              size="small"
              sx={{
                position: "absolute",
                top: 10,
                left: 10,
                bgcolor: "rgba(0,0,0,0.65)",
                color: "#fff",
                fontWeight: 700,
              }}
            />
          )}
        </Box>

        <Stack spacing={1.5} sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={0.5}>
            <Typography sx={{ fontSize: "1rem", fontWeight: 700 }} noWrap>
              {item.asset.title || `Untitled (${item.asset.id.slice(0, 8)})`}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
              {item.uploader.displayName}
              {item.uploader.username ? ` (@${item.uploader.username})` : ""} •{" "}
              {formatRelativeTime(item.asset.createdAt)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            <Chip label="Pending review" color="warning" size="small" />
            <Chip label={asMediaTypeLabel(item)} size="small" variant="outlined" />
            <Chip
              label={
                hasDimensions
                  ? `${item.asset.dimensions.width}x${item.asset.dimensions.height}`
                  : "Unknown size"
              }
              size="small"
              variant="outlined"
            />
            <Chip
              label={formatFileSize(item.asset.fileSize)}
              size="small"
              variant="outlined"
            />
            <Chip label="Reports: -" size="small" variant="outlined" />
          </Stack>

          {item.asset.tags.length > 0 && (
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              {item.asset.tags.slice(0, 8).map((tag) => (
                <Chip key={tag} size="small" label={`#${tag}`} />
              ))}
            </Stack>
          )}

          {riskIndicators.length > 0 && (
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              {riskIndicators.map((risk) => (
                <Chip key={risk} label={risk} color="error" size="small" />
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
            <Button
              variant="contained"
              onClick={() => onApprove(item)}
              disabled={isBusy}
              startIcon={
                busyAction === "approve" ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => onReject(item)}
              disabled={isBusy}
              startIcon={
                busyAction === "reject" ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
            >
              Reject
            </Button>
            <Button
              variant="text"
              onClick={() => onViewDetails(item)}
              disabled={isBusy}
            >
              View Details
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
