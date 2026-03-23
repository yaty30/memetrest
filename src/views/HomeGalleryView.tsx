import { useState } from "react";
import { Skeleton, Box } from "@mui/material";
import SearchBar from "../components/SearchBar";
import GalleryGrid from "../components/GalleryGrid";
import FloatingActionButton from "../components/FloatingActionButton";
import { Lightbox } from "../components/lightbox";
import { useGalleryImages } from "../hooks/useGalleryImages";
import type { GalleryItem } from "../data/galleryItems";

const SKELETON_HEIGHTS = [
  220, 300, 260, 420, 400, 240, 380, 300, 360, 300, 380, 280,
];

function GallerySkeleton() {
  return (
    <Box
      sx={{
        columnCount: { xs: 2, sm: 3, md: 4 },
        columnGap: "16px",
        px: { xs: 1.5, sm: 2.5 },
        pb: 5,
      }}
    >
      {SKELETON_HEIGHTS.map((h, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          animation="wave"
          sx={{
            width: "100%",
            height: h,
            borderRadius: "16px",
            mb: "14px",
            breakInside: "avoid",
          }}
        />
      ))}
    </Box>
  );
}

export default function HomeGalleryView() {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { items, loading, error } = useGalleryImages(searchQuery);

  return (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <div className="gallery-scroll">
        {loading ? (
          <GallerySkeleton />
        ) : error ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              color: "secondary.main",
              fontSize: "0.8125rem",
            }}
          >
            {error}
          </Box>
        ) : (
          <GalleryGrid items={items} onSelect={setSelectedItem} />
        )}
      </div>
      <FloatingActionButton />

      <Lightbox
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
