import { Box } from "@mui/material";
import GalleryCard from "./GalleryCard";
import type { GalleryItem } from "../data/galleryItems";

interface GalleryGridProps {
  items: GalleryItem[];
  onSelect?: (item: GalleryItem) => void;
}

export default function GalleryGrid({ items, onSelect }: GalleryGridProps) {
  return (
    <Box
      sx={{
        columnCount: { xs: 2, sm: 3, md: 4 },
        columnGap: "16px",
        px: { xs: 1.5, sm: 2.5 },
        pb: 5,
        pt: 1,
      }}
    >
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} onSelect={onSelect} />
      ))}
    </Box>
  );
}
