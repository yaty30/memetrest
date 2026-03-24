import { Box } from "@mui/material";
import GalleryCard from "./GalleryCard";
import type { Meme } from "../types/meme";

interface GalleryGridProps {
  items: Meme[];
  onSelect?: (item: Meme) => void;
  onTagClick?: (tag: string) => void;
}

export default function GalleryGrid({
  items,
  onSelect,
  onTagClick,
}: GalleryGridProps) {
  return (
    <Box
      sx={{
        columnCount: { xs: 1, sm: 3, md: 4, lg: 5 },
        columnGap: "16px",
        px: { xs: 1.5, sm: 2.5 },
        pb: 5,
        pt: 1,
      }}
    >
      {items.map((item) => (
        <GalleryCard
          key={item.id}
          item={item}
          onSelect={onSelect}
          onTagClick={onTagClick}
        />
      ))}
    </Box>
  );
}
