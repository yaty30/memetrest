import { Box, Avatar, Typography, IconButton } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { GalleryItem } from "../data/galleryItems";

interface GalleryCardProps {
  item: GalleryItem;
  onSelect?: (item: GalleryItem) => void;
}

export default function GalleryCard({ item, onSelect }: GalleryCardProps) {
  return (
    <Box
      onClick={() => onSelect?.(item)}
      sx={{
        borderRadius: "16px",
        cursor: "pointer",
        breakInside: "avoid",
        mb: "14px",
        transition:
          "transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        "&:hover": {
          transform: "translateY(-3px) scale(1.008)",
          boxShadow:
            "0 12px 32px rgba(124,58,237,0.1), 0 4px 12px rgba(0,0,0,0.06)",
        },
        "&:hover .card-overlay": {
          opacity: 1,
        },
        "&:hover .card-media-wrapper img": {
          transform: "scale(1.02)",
        },
      }}
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
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
              opacity: 0,
              transition: "opacity 0.3s ease",
            }}
          >
            <Avatar
              src={item.overlay.avatar}
              alt={item.overlay.name}
              sx={{ width: 28, height: 28 }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#fff",
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
              sx={{ color: "#fff", p: 0.3 }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}
