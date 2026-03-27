import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArrowLeft,
  Calendar,
  Code2,
  Download,
  Heart,
  Link2,
  Share2,
  Eye,
  ThumbsUp,
  User,
} from "lucide-react";
import type { Meme } from "../types/meme";
import RelatedMemes from "../components/RelatedMemes";
import "./ImageViewerView.css";

/* ── Types ── */

interface ImageViewerViewProps {
  meme: Meme;
  onBack?: () => void;
  onTagClick?: (tag: string) => void;
}

/* ── Helpers ── */

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ── Section label ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        fontSize: "0.6875rem",
        color: "text.secondary",
        letterSpacing: "0.08em",
        lineHeight: 1,
        display: "block",
        mb: 1.25,
      }}
    >
      {children}
    </Typography>
  );
}

/* ── Sub-components ── */

function MetadataRail({
  meme,
  onTagClick,
}: {
  meme: Meme;
  onTagClick?: (tag: string) => void;
}) {
  const stats = [
    { icon: Eye, label: "Downloads", value: formatCount(meme.downloadCount) },
    { icon: ThumbsUp, label: "Likes", value: formatCount(meme.likeCount) },
    { icon: Share2, label: "Shares", value: formatCount(meme.shareCount) },
  ];

  return (
    <Stack spacing={3}>
      {/* Uploader */}
      <Box>
        <SectionLabel>Uploaded by</SectionLabel>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {meme.overlay?.avatar ? (
            <Box
              component="img"
              src={meme.overlay.avatar}
              alt={meme.overlay?.name ?? ""}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={20} />
            </Box>
          )}
          <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
            {meme.overlay?.name || "Anonymous"}
          </Typography>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Stats */}
      <Box>
        <SectionLabel>Engagement</SectionLabel>
        <Stack spacing={1.75}>
          {stats.map(({ icon: Icon, label, value }) => (
            <Stack
              key={label}
              direction="row"
              spacing={1.5}
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon size={17} style={{ opacity: 0.5, flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontSize="0.875rem"
                >
                  {label}
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Category */}
      {meme.category && meme.category !== "uncategorized" && (
        <Box>
          <SectionLabel>Category</SectionLabel>
          <Chip
            label={meme.category}
            size="small"
            sx={{
              bgcolor: "action.hover",
              fontWeight: 500,
              fontSize: "0.8125rem",
              textTransform: "capitalize",
            }}
          />
        </Box>
      )}

      {/* Tags */}
      {meme.tags.length > 0 && (
        <Box>
          <SectionLabel>Tags</SectionLabel>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {meme.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                clickable
                onClick={() => onTagClick?.(tag)}
                sx={{
                  fontSize: "0.8125rem",
                  height: 30,
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Posted time */}
      {meme.createdAt && (
        <Box>
          <SectionLabel>Posted</SectionLabel>
          <Stack direction="row" spacing={1} alignItems="center">
            <Calendar size={16} style={{ opacity: 0.5 }} />
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize="0.875rem"
            >
              {timeAgo(meme.createdAt)}
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function ActionRail({ meme }: { meme: Meme }) {
  const actions = [
    {
      icon: Heart,
      label: "Favorite",
      onClick: undefined as (() => void) | undefined,
    },
    {
      icon: Share2,
      label: "Share",
      onClick: undefined as (() => void) | undefined,
    },
    {
      icon: Link2,
      label: "Copy Link",
      onClick: () => navigator.clipboard.writeText(window.location.href),
    },
    {
      icon: Download,
      label: "Download",
      onClick: () => {
        const a = document.createElement("a");
        a.href = meme.image;
        a.download = meme.title || "meme";
        a.click();
      },
    },
    {
      icon: Code2,
      label: "Embed",
      onClick: undefined as (() => void) | undefined,
    },
  ];

  return (
    <Stack spacing={0.75}>
      <SectionLabel>Actions</SectionLabel>
      {actions.map(({ icon: Icon, label, onClick }) => (
        <Button
          key={label}
          onClick={onClick}
          startIcon={<Icon size={20} strokeWidth={1.6} />}
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            px: 2,
            py: 1.25,
            borderRadius: "12px",
            minHeight: 44,
            "&:hover": {
              bgcolor: "action.hover",
              color: "text.primary",
            },
          }}
        >
          {label}
        </Button>
      ))}
    </Stack>
  );
}

function TagsBelow({
  meme,
  onTagClick,
}: {
  meme: Meme;
  onTagClick?: (tag: string) => void;
}) {
  if (meme.tags.length === 0) return null;
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      sx={{ mt: 2.5, justifyContent: "center" }}
    >
      {meme.tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="medium"
          variant="outlined"
          clickable
          onClick={() => onTagClick?.(tag)}
          sx={{
            fontSize: "0.8125rem",
            height: 32,
            borderColor: "divider",
            "&:hover": {
              borderColor: "primary.main",
              color: "primary.main",
            },
          }}
        />
      ))}
    </Stack>
  );
}

/* ── Main component ── */

export default function ImageViewerView({
  meme,
  onBack,
  onTagClick,
}: ImageViewerViewProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleRelatedSelect = (related: Meme) => {
    navigate(`/meme/${related.id}`);
  };

  /* ── Desktop: 3-column layout ── */
  if (!isMobile) {
    return (
      <Box className="spotlight-root">
        {/* Top bar */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ px: 3, pt: 3, pb: 1 }}
        >
          <IconButton
            onClick={onBack}
            aria-label="Go back"
            sx={{
              color: "text.secondary",
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Typography
            variant="h6"
            sx={{
              color: "text.primary",
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            {meme.title}
          </Typography>
        </Stack>

        {/* 3-column layout */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: { md: 4, lg: 5 },
            width: "100%",
            maxWidth: 1320,
            mx: "auto",
            pt: 3,
            px: 4,
          }}
        >
          {/* Left: metadata rail */}
          <Box
            sx={{
              width: 260,
              flexShrink: 0,
              position: "sticky",
              top: 24,
              bgcolor: "background.paper",
              borderRadius: "16px",
              p: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <MetadataRail meme={meme} onTagClick={onTagClick} />
          </Box>

          {/* Center: main media + tags */}
          <Box
            sx={{
              flex: 1,
              maxWidth: 780,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: theme.palette.customShadows.viewer,
                bgcolor: "background.paper",
                lineHeight: 0,
              }}
            >
              <Box
                component="img"
                src={meme.image}
                alt={meme.title}
                sx={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  maxHeight: "82vh",
                  objectFit: "contain",
                }}
              />
            </Box>
            <TagsBelow meme={meme} onTagClick={onTagClick} />
          </Box>

          {/* Right: action rail */}
          <Box
            sx={{
              width: 250,
              flexShrink: 0,
              position: "sticky",
              top: 24,
              bgcolor: "background.paper",
              borderRadius: "16px",
              p: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <ActionRail meme={meme} />
          </Box>
        </Box>

        {/* Related memes section */}
        <Box
          sx={{
            maxWidth: 1320,
            mx: "auto",
            mt: 6,
            px: 4,
            pb: 5,
          }}
        >
          <RelatedMemes meme={meme} onSelect={handleRelatedSelect} />
        </Box>
      </Box>
    );
  }

  /* ── Mobile: stacked layout ── */
  return (
    <Box className="spotlight-root" sx={{ px: 2, pt: 2, pb: 4 }}>
      {/* Top bar */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <IconButton
          onClick={onBack}
          aria-label="Go back"
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <ArrowLeft size={20} />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ fontSize: "0.9375rem", fontWeight: 600, flex: 1, minWidth: 0 }}
          noWrap
        >
          {meme.title}
        </Typography>
      </Stack>

      {/* Image */}
      <Box
        sx={{
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: theme.palette.customShadows.viewer,
          bgcolor: "background.paper",
          lineHeight: 0,
        }}
      >
        <Box
          component="img"
          src={meme.image}
          alt={meme.title}
          sx={{
            display: "block",
            width: "100%",
            height: "auto",
            maxHeight: "60vh",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Tags */}
      <TagsBelow meme={meme} onTagClick={onTagClick} />

      {/* Actions */}
      <Box
        sx={{
          mt: 2.5,
          bgcolor: "background.paper",
          borderRadius: "14px",
          p: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <ActionRail meme={meme} />
      </Box>

      {/* Metadata */}
      <Box
        sx={{
          mt: 2,
          bgcolor: "background.paper",
          borderRadius: "14px",
          p: 2.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <MetadataRail meme={meme} onTagClick={onTagClick} />
      </Box>

      {/* Related */}
      <Box sx={{ mt: 3 }}>
        <RelatedMemes meme={meme} onSelect={handleRelatedSelect} />
      </Box>
    </Box>
  );
}
