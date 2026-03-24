import {
  Box,
  Avatar,
  Chip,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Meme } from "../types/meme";

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
  return (
    <Box
      onClick={() => onSelect?.(item)}
      sx={(theme) => ({
        borderRadius: "16px",
        cursor: "pointer",
        breakInside: "avoid",
        mb: "14px",
        transition:
          "transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s ease",
        boxShadow: theme.palette.customShadows.card,
        "&:hover": {
          transform: "translateY(-3px) scale(1.008)",
          boxShadow: theme.palette.customShadows.cardHover,
        },
        "&:hover .card-overlay": {
          opacity: 1,
        },
        "&:hover .card-tags": {
          opacity: 1,
        },
        "&:hover .card-media-wrapper img": {
          transform: "scale(1.02)",
        },
      })}
    >
      {/* Inner wrapper with overflow:hidden + borderRadius to cleanly clip the scaled image */}
      <Box
        className="card-media-wrapper"
        sx={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          willChange: "transform",
        }}
      >
        <Box
          component="img"
          src={item.image}
          alt={item.title}
          loading="lazy"
          sx={{
            display: "block",
            width: "100%",
            height: item.height,
            objectFit: "cover",
            transition: "transform 0.4s cubic-bezier(0.2,0.8,0.2,1)",
          }}
        />

        {item.overlay && (
          <Box
            className="card-overlay"
            sx={(theme) => ({
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: theme.palette.gradient.cardOverlay,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
              opacity: 0,
              transition: "opacity 0.3s ease",
            })}
          >
            <Avatar
              src={item.overlay.avatar}
              alt={item.overlay.name}
              sx={{ width: 28, height: 28 }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "overlay.text",
                fontSize: "0.75rem",
                fontWeight: 500,
                flex: 1,
                lineHeight: 1.3,
                letterSpacing: "0.01em",
              }}
            >
              {item.overlay.name}
            </Typography>
            <IconButton
              size="small"
              aria-label="More options"
              sx={{ color: "overlay.text", p: 0.3 }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}

        {/* Tag chips — visible on hover */}
        {item.tags.length > 0 && (
          <Stack
            className="card-tags"
            direction="row"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              right: 8,
              flexWrap: "wrap",
              gap: "4px",
              opacity: 0,
              transition: "opacity 0.3s ease",
              pointerEvents: "auto",
            }}
          >
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
                  height: 22,
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "#fff",
                  bgcolor: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  "& .MuiChip-label": { px: 0.75 },
                  "&:hover": {
                    bgcolor: "rgba(94,234,212,0.25)",
                    color: "primary.main",
                  },
                }}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
