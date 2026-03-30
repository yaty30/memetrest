import { useRef, useState } from "react";
import {
  Box,
  Chip,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Skeleton,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CodeIcon from "@mui/icons-material/Code";
import LinkIcon from "@mui/icons-material/Link";
import type { Meme } from "../types/meme";
import GifBadge from "./GifBadge";
import { normalizeMediaDimensions } from "../utils/mediaDimensions";
import { useMemeLike } from "../hooks/useMemeLike";
import SignInDialog from "./SignInDialog";

interface GalleryCardProps {
  item: Meme;
  onSelect?: (item: Meme) => void;
  onTagClick?: (tag: string) => void;
}

export default function GalleryCard({
  item,
  onSelect,
  onTagClick,
}: GalleryCardProps) {
  const [signInOpen, setSignInOpen] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackMsg, setSnackMsg] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const { viewerHasLiked, likeCount, likePending, handleLike } = useMemeLike({
    memeId: item.id,
    initialLikeCount: item.likeCount,
    initialViewerHasLiked: item.viewerHasLiked,
    onAuthRequired: () => setSignInOpen(true),
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleLike();
  };

  const liked = viewerHasLiked;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: item.title, url: item.image }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.image);
      setSnackMsg("Link copied!");
    }
  };

  const handleMoreClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(item.image);
    setSnackMsg("Link copied!");
    handleMenuClose();
  };

  const handleCopyEmbed = () => {
    const embed = `<img src="${item.image}" alt="${item.title}" />`;
    navigator.clipboard.writeText(embed);
    setSnackMsg("Embed code copied!");
    handleMenuClose();
  };

  const displayName = item.overlay?.name ?? "Anonymous";
  const hasMissingDimensions =
    !Number.isFinite(item.width) ||
    !Number.isFinite(item.height) ||
    item.width <= 0 ||
    item.height <= 0;
  if (hasMissingDimensions) {
    console.warn(
      `[GalleryCard] Missing or invalid dimensions for "${item.id}": width=${item.width}, height=${item.height}. Using fallback.`,
    );
  }
  const media = normalizeMediaDimensions({
    width: item.width,
    height: item.height,
    aspectRatio: item.aspectRatio,
    fallbackWidth: 480,
    fallbackHeight: 320,
  });

  return (
    <>
      <Box
        ref={cardRef}
        onClick={() => onSelect?.(item)}
        sx={(theme) => ({
          borderRadius: "16px",
          cursor: "pointer",
          breakInside: "avoid",
          mb: "14px",
          position: "relative",
          transition:
            "transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s ease",
          boxShadow: theme.palette.customShadows.card,
          "&:hover": {
            transform: "translateY(-3px) scale(1.008)",
            boxShadow: theme.palette.customShadows.cardHover,
          },
          "&:hover .card-hover-overlay": { opacity: 1 },
          "&:hover .card-media-wrapper .card-media-image": {
            transform: "scale(1.03)",
          },
          // Mobile: always show overlay lightly
          "@media (hover: none)": {
            "& .card-hover-overlay": { opacity: 1 },
          },
        })}
      >
        <Box
          className="card-media-wrapper"
          sx={{
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            willChange: "transform",
            // Reserve deterministic space from persisted metadata.
            aspectRatio: `${media.width} / ${media.height}`,
            bgcolor: "rgba(255,255,255,0.04)",
          }}
        >
          <Skeleton
            variant="rectangular"
            animation="wave"
            height="100%"
            width="100%"
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              opacity: isMediaLoaded ? 0 : 1,
              transition: "opacity 0.25s ease",
              pointerEvents: "none",
            }}
          />

          <Box
            component="img"
            className="card-media-image"
            src={item.image}
            alt={item.title}
            loading="lazy"
            width={media.width}
            height={media.height}
            onLoad={() => setIsMediaLoaded(true)}
            onError={() => setIsMediaLoaded(true)}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              // Wrapper and media share the same stored ratio, so cover prevents letterboxing.
              objectFit: "cover",
              opacity: isMediaLoaded ? 1 : 0,
              transition:
                "opacity 0.25s ease, transform 0.4s cubic-bezier(0.2,0.8,0.2,1)",
            }}
          />

          {/* Full hover overlay */}
          <Box
            className="card-hover-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.65) 100%)",
              opacity: 0,
              transition: "opacity 0.3s ease",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
              borderRadius: "16px",
            }}
          >
            {/* Top row: GIF badge left + action buttons right */}
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                p: 1,
                pointerEvents: "auto",
              }}
            >
              {/* Top-left: media-type badge */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {item.animated && <GifBadge />}
              </Box>

              {/* Top-right: action buttons */}
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={handleLikeClick}
                  aria-label="Favourite"
                  sx={{
                    color: liked ? "#ff4081" : "#fff",
                    bgcolor: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(8px)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                    width: 32,
                    height: 32,
                  }}
                >
                  {liked ? (
                    <FavoriteIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>

                <IconButton
                  size="small"
                  onClick={handleShare}
                  aria-label="Share"
                  sx={{
                    color: "#fff",
                    bgcolor: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(8px)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <ShareIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={handleMoreClick}
                  aria-label="More options"
                  sx={{
                    color: "#fff",
                    bgcolor: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(8px)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <MoreHorizIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Bottom info area */}
            <Box sx={{ px: 1.5, pb: 1.5, pt: 0, pointerEvents: "auto" }}>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  mb: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ mb: 0.75 }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "0.65rem",
                    fontWeight: 500,
                  }}
                >
                  {displayName}
                </Typography>
                {likeCount > 0 && (
                  <>
                    <Box
                      sx={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.4)",
                      }}
                    />
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: "0.6rem",
                        fontWeight: 500,
                      }}
                    >
                      {likeCount.toLocaleString()}{" "}
                      {likeCount === 1 ? "like" : "likes"}
                    </Typography>
                  </>
                )}
              </Stack>

              {item.tags.length > 0 && (
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: "5px" }}>
                  {item.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick?.(tag);
                      }}
                      sx={{
                        height: 20,
                        fontSize: "0.575rem",
                        fontWeight: 600,
                        color: "#fff",
                        bgcolor: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        "& .MuiChip-label": { px: 0.6 },
                        "&:hover": {
                          bgcolor: "rgba(94,234,212,0.3)",
                          color: "#5eead4",
                        },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* More menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              minWidth: 180,
              bgcolor: "surface.glass",
              backdropFilter: "blur(16px)",
              border: "1px solid",
              borderColor: "surface.glassBorder",
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <LinkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
            Copy link
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyEmbed}>
          <ListItemIcon>
            <CodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
            Copy embed code
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Feedback snackbar */}
      <Snackbar
        open={Boolean(snackMsg)}
        autoHideDuration={2000}
        onClose={() => setSnackMsg("")}
        message={snackMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
