import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Calendar,
  Download,
  Heart,
  Link2,
  Share2,
  Eye,
  ThumbsUp,
  User,
} from "lucide-react";
import AppNavbar from "../components/navigation/AppNavbar";
import RelatedMemes from "../components/RelatedMemes";
import { memeService } from "../services";
import type { Meme } from "../types/meme";
import { PAGE_MAX_WIDTH, PAGE_NAV_PADDING_X } from "./pageLayout";

interface MemeDetailContentProps {
  meme: Meme;
  onBack?: () => void;
  onTagClick?: (tag: string) => void;
}

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

function MetadataSummary({ meme }: { meme: Meme }) {
  const posted = meme.createdAt ? timeAgo(meme.createdAt) : "Unknown date";

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {meme.overlay?.avatar ? (
          <Box
            component="img"
            src={meme.overlay.avatar}
            alt={meme.overlay?.name ?? ""}
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={15} />
          </Box>
        )}
        <Typography
          variant="body2"
          sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
        >
          {meme.overlay?.name || "Anonymous"}
        </Typography>
      </Stack>

      <Chip
        size="small"
        icon={<Calendar size={14} />}
        label={posted}
        variant="outlined"
        sx={{
          height: 28,
          borderColor: "divider",
          "& .MuiChip-label": { fontSize: "0.75rem", px: 1.1 },
        }}
      />

      <Chip
        size="small"
        icon={<Eye size={14} />}
        label={`${formatCount(meme.downloadCount)} downloads`}
        variant="outlined"
        sx={{
          height: 28,
          borderColor: "divider",
          "& .MuiChip-label": { fontSize: "0.75rem", px: 1.1 },
        }}
      />

      <Chip
        size="small"
        icon={<ThumbsUp size={14} />}
        label={`${formatCount(meme.likeCount)} likes`}
        variant="outlined"
        sx={{
          height: 28,
          borderColor: "divider",
          "& .MuiChip-label": { fontSize: "0.75rem", px: 1.1 },
        }}
      />

      <Chip
        size="small"
        icon={<Share2 size={14} />}
        label={`${formatCount(meme.shareCount)} shares`}
        variant="outlined"
        sx={{
          height: 28,
          borderColor: "divider",
          "& .MuiChip-label": { fontSize: "0.75rem", px: 1.1 },
        }}
      />
    </Stack>
  );
}

function ActionButtons({ meme }: { meme: Meme }) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard may be unavailable in insecure contexts.
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = meme.image;
    a.download = meme.title || "meme";
    a.click();
  };

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
    { icon: Link2, label: "Copy link", onClick: handleCopyLink },
    { icon: Download, label: "Download", onClick: handleDownload },
  ];

  return (
    <Stack direction="column" spacing={1} alignItems="center" gap={1.4}>
      {actions.map(({ icon: Icon, label, onClick }) => (
        <IconButton
          key={label}
          onClick={onClick}
          aria-label={label}
          sx={(theme) => ({
            width: 60,
            height: 60,
            borderRadius: "14px",
            color: "text.secondary",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            bgcolor: alpha(theme.palette.background.paper, 0.52),
            border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
            "&:hover": {
              color: "text.primary",
              bgcolor: alpha(theme.palette.background.paper, 0.72),
              borderColor: alpha(theme.palette.common.white, 0.26),
            },
          })}
        >
          <Icon size={26} strokeWidth={1.8} />
        </IconButton>
      ))}
    </Stack>
  );
}

function TagsBelow({
  meme,
  onTagClick,
  centered = true,
}: {
  meme: Meme;
  onTagClick?: (tag: string) => void;
  centered?: boolean;
}) {
  if (meme.tags.length === 0) return null;
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      sx={{ justifyContent: centered ? "center" : "flex-start" }}
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

function MemeDetailContent({
  meme,
  onBack,
  onTagClick,
}: MemeDetailContentProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const mediaFrameRef = useRef<HTMLDivElement | null>(null);
  const metadataRef = useRef<HTMLDivElement | null>(null);
  const [mediaMaxHeight, setMediaMaxHeight] = useState<number | null>(null);
  const mediaCanvasMinHeight = isMobile ? 220 : 300;
  const heroCanvasMinHeight = isMobile ? 280 : 360;

  useLayoutEffect(() => {
    let rafId = 0;

    const recomputeMediaBudget = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const root = rootRef.current;
        const header = headerRef.current;
        const hero = heroRef.current;
        const media = mediaFrameRef.current;
        const metadata = metadataRef.current;
        if (!root || !header || !hero || !media || !metadata) return;

        const viewportHeight = window.innerHeight;
        const rootTop = root.getBoundingClientRect().top;
        const visibleCardBudget = Math.max(320, viewportHeight - rootTop - 20);

        const headerHeight = header.getBoundingClientRect().height;
        const heroHeight = hero.getBoundingClientRect().height;
        const mediaHeight = media.getBoundingClientRect().height;
        const metadataHeight = metadata.getBoundingClientRect().height;
        const heroNonMediaHeight = Math.max(0, heroHeight - mediaHeight);

        const availableForMedia =
          visibleCardBudget -
          headerHeight -
          metadataHeight -
          heroNonMediaHeight;
        const nextMaxHeight = Math.max(
          mediaCanvasMinHeight,
          Math.floor(availableForMedia),
        );

        setMediaMaxHeight((prev) =>
          prev !== null && Math.abs(prev - nextMaxHeight) < 2
            ? prev
            : nextMaxHeight,
        );
      });
    };

    recomputeMediaBudget();

    const observer = new ResizeObserver(recomputeMediaBudget);
    const observed = [
      rootRef.current,
      headerRef.current,
      heroRef.current,
      mediaFrameRef.current,
      metadataRef.current,
    ].filter((el): el is HTMLDivElement => Boolean(el));
    observed.forEach((el) => observer.observe(el));
    window.addEventListener("resize", recomputeMediaBudget);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", recomputeMediaBudget);
    };
  }, [meme.id, mediaCanvasMinHeight]);

  return (
    <Box ref={rootRef}>
      {/* Card header: back nav + category — structural, not floating */}
      <Stack
        ref={headerRef}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: { xs: 1.75, md: 2.25 },
          pt: { xs: 1.25, md: 1.5 },
          pb: 0,
        }}
      >
        {onBack ? (
          <IconButton
            onClick={onBack}
            aria-label="Go back"
            size="small"
            sx={(theme) => ({
              width: 34,
              height: 34,
              borderRadius: "11px",
              color: "text.secondary",
              border: `1px solid ${theme.palette.divider}`,
              "&:hover": {
                color: "text.primary",
                bgcolor: "action.hover",
                borderColor: "text.disabled",
              },
            })}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : (
          <Box sx={{ width: 34, height: 34 }} />
        )}

        {meme.category && meme.category !== "uncategorized" ? (
          <Chip
            label={meme.category}
            size="small"
            sx={{
              height: 26,
              textTransform: "capitalize",
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              "& .MuiChip-label": { fontSize: "0.72rem", px: 1.1 },
            }}
          />
        ) : null}
      </Stack>

      {/* Hero: image + action rail */}
      <Box
        ref={heroRef}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          px: 2,
          pt: 1.5,
          pb: 6,
          minHeight: heroCanvasMinHeight,
        }}
      >
        {/* Image — intrinsic size, not stretched to card width */}
        <Box
          ref={mediaFrameRef}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
            overflow: "hidden",
            lineHeight: 0,
            flexShrink: 1,
            minWidth: 0,
            minHeight: { xs: 220, md: 300 },
            height:
              mediaMaxHeight !== null
                ? `${mediaMaxHeight}px`
                : { xs: "min(52vh, 460px)", md: "min(60vh, 640px)" },
            width: {
              xs: "min(78vw, 480px)",
              md: "min(58vw, 640px)",
            },
            maxWidth: {
              xs: "calc(100% - 88px)",
              md: "min(calc(100% - 96px), 640px)",
            },
          }}
        >
          <Box
            component="img"
            src={meme.image}
            alt={meme.title}
            sx={{
              display: "block",
              maxHeight:
                mediaMaxHeight !== null
                  ? `${mediaMaxHeight}px`
                  : { xs: "min(52vh, 460px)", md: "min(60vh, 640px)" },
              width: "auto",
              maxWidth: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Action rail */}
        <ActionButtons meme={meme} />
      </Box>

      {/* Metadata strip — connected to hero, more compositional weight */}
      <Box
        ref={metadataRef}
        sx={(theme) => ({
          px: { xs: 1.75, md: 2.25 },
          pt: { xs: 2, md: 2.5 },
          pb: { xs: 2.25, md: 2.75 },
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.default, 0.25),
        })}
      >
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            fontSize: { xs: "1.05rem", sm: "1.18rem", md: "1.32rem" },
            mb: { xs: 1.5, md: 2 },
          }}
        >
          {meme.title}
        </Typography>

        <MetadataSummary meme={meme} />

        {meme.tags.length > 0 && (
          <Box sx={{ mt: { xs: 1.5, md: 1.75 } }}>
            <TagsBelow meme={meme} onTagClick={onTagClick} centered={false} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function ImageViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meme, setMeme] = useState<Meme | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    memeService.getMemeById(id).then((item) => {
      if (item) {
        setMeme(item);
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleRelatedSelect = (related: Meme) => {
    navigate(`/meme/${related.id}`);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <Box
        sx={{
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: PAGE_NAV_PADDING_X,
          pt: { xs: 1.5, sm: 2 },
          pb: 0,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <AppNavbar />
      </Box>

      {/* Content — same horizontal bounds as navbar */}
      <Box
        sx={{
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: PAGE_NAV_PADDING_X,
          pt: { xs: 1.5, sm: 2 },
          pb: { xs: 2.5, md: 3 },
          boxSizing: "border-box",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {notFound ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              py: 8,
            }}
          >
            <Typography color="text.secondary">Image not found</Typography>
          </Box>
        ) : !meme ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              py: 8,
            }}
          >
            <CircularProgress size={32} sx={{ color: "text.secondary" }} />
          </Box>
        ) : (
          <>
            {/* Main card — same width as navbar */}
            <Box
              component="main"
              sx={(theme) => ({
                backgroundColor: "surface.container",
                borderRadius: "22px",
                border: `1px solid ${theme.palette.action.hover}`,
                boxShadow: theme.palette.customShadows.container,
                overflow: "hidden",
              })}
            >
              <MemeDetailContent
                meme={meme}
                onBack={handleBack}
                onTagClick={(tag) =>
                  navigate(`/?search=${encodeURIComponent(tag)}`)
                }
              />
            </Box>

            {/* Related memes — outside the card, same width */}
            <RelatedMemes meme={meme} onSelect={handleRelatedSelect} />
          </>
        )}
      </Box>
    </Box>
  );
}
