import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import type { UploadCardModel } from "../services/uploadCardMapper";

interface UploadAssetCardProps {
  item: UploadCardModel;
  submitting: boolean;
  onSubmitForReview: (assetId: string) => void;
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function workflowHint(status: string, visibility: string): string | null {
  if (status === "published" && visibility === "public") {
    return "Published publicly.";
  }
  if (status === "pending_review") {
    return "Submitted for review. Still private.";
  }
  if (status === "rejected") {
    return "Rejected. Not public.";
  }
  if (status === "uploaded" && visibility === "private") {
    return "Private upload.";
  }
  return null;
}

const badgeColorMap: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  uploaded: {
    bg: "rgba(96,165,250,0.22)",
    color: "#93c5fd",
    border: "rgba(96,165,250,0.25)",
  },
  pending_review: {
    bg: "rgba(251,191,36,0.2)",
    color: "#fcd34d",
    border: "rgba(251,191,36,0.22)",
  },
  published: {
    bg: "rgba(52,211,153,0.2)",
    color: "#6ee7b7",
    border: "rgba(52,211,153,0.22)",
  },
  rejected: {
    bg: "rgba(248,113,113,0.2)",
    color: "#fca5a5",
    border: "rgba(248,113,113,0.22)",
  },
  removed: {
    bg: "rgba(156,163,175,0.18)",
    color: "#d1d5db",
    border: "rgba(156,163,175,0.2)",
  },
  private: {
    bg: "rgba(156,163,175,0.16)",
    color: "#d1d5db",
    border: "rgba(156,163,175,0.18)",
  },
  public: {
    bg: "rgba(52,211,153,0.2)",
    color: "#6ee7b7",
    border: "rgba(52,211,153,0.22)",
  },
};

function StyledChip({ label, variant }: { label: string; variant: string }) {
  const colors = badgeColorMap[variant] ?? badgeColorMap.removed;
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: "auto",
        px: 1,
        py: 0.25,
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: 1.6,
        borderRadius: "6px",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        bgcolor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        "& .MuiChip-label": { px: 0 },
      }}
    />
  );
}

export default function UploadAssetCard({
  item,
  submitting,
  onSubmitForReview,
}: UploadAssetCardProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);

  useEffect(() => {
    setPreviewLoaded(false);
    setPreviewLoadFailed(false);
  }, [item.id, item.previewUrl]);

  const preview = item.previewUrl;
  const showPreview = Boolean(preview) && previewLoaded && !previewLoadFailed;
  const isReviewable =
    item.reviewStatus === "uploaded" && item.visibility === "public";
  const hint = workflowHint(item.reviewStatus, item.visibility);
  const hasDimensions = item.width > 0 && item.height > 0;

  return (
    <Card
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "14px",
        overflow: "hidden",
        bgcolor: "var(--upload-card-bg, #1a1a1a)",
        border: "1px solid rgba(255,255,255,0.08)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        backgroundImage: "none",
        "&:hover": {
          borderColor: "rgba(255,255,255,0.14)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* Preview area */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          bgcolor: "rgba(20,20,20,0.6)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {preview && (
          <Box
            component="img"
            src={preview ?? undefined}
            alt={item.title || "Upload preview"}
            draggable={false}
            loading="lazy"
            onLoad={() => setPreviewLoaded(true)}
            onError={() => {
              setPreviewLoaded(false);
              setPreviewLoadFailed(true);
            }}
            sx={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              userSelect: "none",
              opacity: showPreview ? 1 : 0,
              transition: "opacity 180ms ease",
            }}
          />
        )}

        {!showPreview && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              color: "rgba(255,255,255,0.2)",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <CircularProgress size={28} thickness={4.5} />
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            left: 8,
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <StyledChip
            label={toLabel(item.reviewStatus)}
            variant={item.reviewStatus}
          />
          <StyledChip
            label={toLabel(item.visibility)}
            variant={item.visibility}
          />
        </Box>
      </Box>

      {/* Card body */}
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          p: "12px 14px 14px",
          flex: 1,
          minHeight: 0,
          "&:last-child": { pb: "14px" },
        }}
      >
        <Typography
          variant="subtitle2"
          component="h3"
          sx={{
            m: 0,
            fontSize: "0.875rem",
            fontWeight: 650,
            lineHeight: 1.4,
            color: "#f0f0f0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
        >
          {item.title || `Untitled upload (${item.id.slice(0, 8)})`}
        </Typography>

        <Typography
          variant="caption"
          component="div"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "2px 6px",
            fontSize: "0.75rem",
            color: "#9ca3af",
            lineHeight: 1.5,
          }}
        >
          <span>{item.mimeType}</span>
          {hasDimensions && (
            <>
              <span>·</span>
              <span>
                {item.width}x{item.height}
              </span>
            </>
          )}
          <span>·</span>
          <span>{formatDate(item.createdAt)}</span>
        </Typography>

        {hint && (
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.7188rem",
              lineHeight: 1.5,
              color: "#9ca3af",
              fontStyle: "italic",
              mt: "2px",
            }}
          >
            {hint}
          </Typography>
        )}
      </CardContent>

      {isReviewable && (
        <CardActions sx={{ px: "14px", pb: "14px", pt: 0, mt: "auto" }}>
          <Button
            variant="outlined"
            size="small"
            disabled={submitting}
            onClick={() => onSubmitForReview(item.id)}
            sx={{
              borderRadius: "8px",
              borderColor: "rgba(94,234,212,0.35)",
              bgcolor: "rgba(94,234,212,0.08)",
              color: "#5eead4",
              fontSize: "0.75rem",
              fontWeight: 600,
              lineHeight: 1.5,
              textTransform: "none",
              whiteSpace: "nowrap",
              "&:hover": {
                bgcolor: "rgba(94,234,212,0.15)",
                borderColor: "rgba(94,234,212,0.5)",
              },
            }}
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
