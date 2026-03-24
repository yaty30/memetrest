import { useState } from "react";
import { Skeleton, Box } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import GalleryGrid from "../components/GalleryGrid";
import FloatingActionButton from "../components/FloatingActionButton";
import { Lightbox } from "../components/lightbox";
import { useGalleryImages } from "../hooks/useGalleryImages";
import { useDiscoveryFilters } from "../hooks/useDiscoveryFilters";
import type { Meme } from "../types/meme";
import EmptyIcon from "../components/EmptyIcon";

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
  const [selectedItem, setSelectedItem] = useState<Meme | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    filters,
    setCategory,
    toggleTag,
    setSortBy,
    clearFilters,
    hasActiveFilters,
  } = useDiscoveryFilters();

  const { items, loading, error } = useGalleryImages(searchQuery, filters);

  const handleTagClick = (tag: string) => {
    toggleTag(tag);
  };

  return (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <FilterBar
        activeCategory={filters.activeCategory}
        activeTags={filters.activeTags}
        sortBy={filters.sortBy}
        hasActiveFilters={hasActiveFilters}
        onCategoryChange={setCategory}
        onTagRemove={toggleTag}
        onSortChange={setSortBy}
        onClearAll={clearFilters}
      />
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
        ) : items.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              color: "secondary.main",
            }}
          >
            <EmptyIcon />
            <Box sx={{ mt: 2, fontSize: "0.8125rem" }}>
              Nothing to see here.
            </Box>
          </Box>
        ) : (
          <GalleryGrid
            items={items}
            onSelect={setSelectedItem}
            onTagClick={handleTagClick}
          />
        )}
      </div>
      <FloatingActionButton />

      <Lightbox
        item={selectedItem}
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        onTagClick={handleTagClick}
      />
    </>
  );
}
