import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { PendingApprovalItem } from "../../hooks/usePendingApprovalQueue";
import type { ApprovalAction } from "./approvalTypes";

interface ApprovalDetailsModalProps {
  open: boolean;
  item: PendingApprovalItem | null;
  busyAction: ApprovalAction | null;
  onClose: () => void;
  onApprove: (item: PendingApprovalItem) => void;
  onReject: (item: PendingApprovalItem, reason: string | null) => void;
}

function formatDate(ts: number): string {
  if (!Number.isFinite(ts) || ts <= 0) return "-";
  return new Date(ts).toLocaleString();
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="space-between">
      <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: "0.8125rem", fontWeight: 500, textAlign: "right" }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function ApprovalDetailsModal({
  open,
  item,
  busyAction,
  onClose,
  onApprove,
  onReject,
}: ApprovalDetailsModalProps) {
  const activeItemId = open ? item?.id ?? null : null;
  const [rejectionState, setRejectionState] = useState<{
    itemId: string | null;
    value: string;
  }>({
    itemId: null,
    value: "",
  });
  const rejectionReason =
    rejectionState.itemId === activeItemId ? rejectionState.value : "";

  const isBusy = busyAction !== null;

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="approval-details-title"
    >
      <DialogTitle id="approval-details-title">Review Asset Details</DialogTitle>
      <DialogContent dividers>
        {!item ? null : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) minmax(0, 1fr)" },
              gap: 2,
            }}
          >
            <Box
              sx={(theme) => ({
                minHeight: { xs: 280, md: 460 },
                borderRadius: "10px",
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
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
                  alt={item.asset.title || "Pending approval preview"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Typography sx={{ color: "text.secondary" }}>
                  Preview unavailable
                </Typography>
              )}
            </Box>

            <Stack spacing={1.4}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>
                {item.asset.title || `Untitled (${item.asset.id.slice(0, 8)})`}
              </Typography>

              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                <Chip label="Pending review" color="warning" size="small" />
                <Chip
                  size="small"
                  label={item.asset.isAnimated || item.asset.kind === "gif" ? "GIF" : "Image"}
                />
                <Chip size="small" label={`Visibility: ${item.asset.visibility}`} />
              </Stack>

              <Divider />

              <DetailRow label="Asset ID" value={item.asset.id} />
              <DetailRow label="Uploader" value={item.uploader.displayName} />
              <DetailRow
                label="Username"
                value={item.uploader.username ? `@${item.uploader.username}` : "-"}
              />
              <DetailRow label="Uploader UID" value={item.uploader.uid} />
              <DetailRow label="Created" value={formatDate(item.asset.createdAt)} />
              <DetailRow label="Updated" value={formatDate(item.asset.updatedAt)} />
              <DetailRow
                label="Dimensions"
                value={`${item.asset.dimensions.width}x${item.asset.dimensions.height}`}
              />
              <DetailRow label="File size" value={formatFileSize(item.asset.fileSize)} />
              <DetailRow label="MIME type" value={item.asset.mimeType || "-"} />
              <DetailRow label="Report count" value="-" />
              <DetailRow
                label="Sensitive flag"
                value={item.asset.moderation.userSensitiveFlag ? "Yes" : "No"}
              />
              <DetailRow label="Scan state" value={item.asset.moderation.scanState} />
              <DetailRow label="Scan result" value={item.asset.moderation.scanResult} />
              <DetailRow
                label="Review decision"
                value={item.asset.moderation.finalDecision}
              />

              <TextField
                size="small"
                multiline
                minRows={2}
                label="Rejection reason (optional)"
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionState({
                    itemId: activeItemId,
                    value: event.target.value,
                  })
                }
                placeholder="Not required yet; included for future rejection workflow."
              />

              {item.asset.tags.length > 0 && (
                <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                  {item.asset.tags.map((tag) => (
                    <Chip key={tag} size="small" label={`#${tag}`} />
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} disabled={isBusy}>
          Close
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            if (!item) return;
            onReject(item, rejectionReason.trim() || null);
          }}
          disabled={!item || isBusy}
          startIcon={
            busyAction === "reject" ? (
              <CircularProgress size={14} color="inherit" />
            ) : undefined
          }
        >
          Reject
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            if (!item) return;
            onApprove(item);
          }}
          disabled={!item || isBusy}
          startIcon={
            busyAction === "approve" ? (
              <CircularProgress size={14} color="inherit" />
            ) : undefined
          }
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
}
