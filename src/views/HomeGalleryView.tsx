import { useState, useEffect } from "react";
import { Skeleton, Box, Fade, Stack } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import GalleryGrid from "../components/GalleryGrid";
import FloatingActionButton from "../components/FloatingActionButton";
import { Lightbox } from "../components/lightbox";
import { useGalleryImages } from "../hooks/useGalleryImages";
import { useDiscoveryFilters } from "../hooks/useDiscoveryFilters";
import type { Meme } from "../types/meme";
import emptyImg from "../assets/empty.png";

const SKELETON_HEIGHTS = [
  220, 300, 260, 420, 400, 240, 380, 300, 360, 300, 380, 280,
];

const LABEL = "NOTHING_TO_SEE_HERE".split("");

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
            <Fade in={true} timeout={4000}>
              <img
                src={emptyImg}
                alt="Nothing found"
                draggable={false}
                style={{
                  maxWidth: 200,
                  filter: "grayscale(100%) opacity(0.3)",
                  animation: "slowZoomIn 6s ease-out forwards",
                }}
              />
            </Fade>
            <Stack direction="row" sx={{ mt: 2, userSelect: "none" }}>
              {LABEL.map((letter, index) => (
                <Fade in={true} timeout={5000 + index * 150} key={index}>
                  <Box
                    sx={{
                      mt: 2,
                      fontSize: "1.2125rem",
                      fontWeight: 600,
                      opacity: 0.3,
                      color: "#333",
                    }}
                  >
                    {letter === "_" ? "\u00A0" : letter}
                  </Box>
                </Fade>
              ))}
            </Stack>
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
