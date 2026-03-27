import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Fade, Stack, Typography, Button } from "@mui/material";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import GalleryGrid from "../components/GalleryGrid";
import FloatingActionButton from "../components/FloatingActionButton";
import { usePaginatedMemes } from "../hooks/usePaginatedMemes";
import { useDiscoveryFilters } from "../hooks/useDiscoveryFilters";
import type { Meme } from "../types/meme";
import emptyImg from "../assets/empty.png";

const LABEL = "NOTHING_TO_SEE_HERE".split("");

export default function HomeGalleryView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") ?? "",
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value) {
      setSearchParams({ search: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const {
    filters,
    setCategory,
    toggleTag,
    setSortBy,
    clearFilters,
    hasActiveFilters,
  } = useDiscoveryFilters();

  const {
    items,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    paginationError,
    sentinelRef,
    scrollContainerRef,
    loadMore,
  } = usePaginatedMemes(searchQuery, filters);

  const handleSelect = (meme: Meme) => {
    navigate(`/meme/${meme.id}`);
  };

  const handleTagClick = (tag: string) => {
    toggleTag(tag);
  };

  return (
    <>
      <SearchBar value={searchQuery} onChange={handleSearchChange} />
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
      <div className="gallery-scroll" ref={scrollContainerRef}>
        {loadingInitial ? (
          <GalleryGrid
            items={[]}
            loading
            onSelect={handleSelect}
            onTagClick={handleTagClick}
          />
        ) : error && items.length === 0 ? (
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
          <>
            <GalleryGrid
              items={items}
              loadingMore={loadingMore}
              onSelect={handleSelect}
              onTagClick={handleTagClick}
            />

            {/* Pagination error — retry UI */}
            {paginationError && (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  sx={{
                    color: "error.main",
                    fontSize: "0.8125rem",
                    mb: 1,
                  }}
                >
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadMore}
                  sx={{ textTransform: "none" }}
                >
                  Retry
                </Button>
              </Box>
            )}

            {/* End-of-feed indicator — only when all items are loaded */}
            {!hasMore && !loadingMore && !paginationError && (
              <Box sx={{ textAlign: "center", py: 3, pb: 5 }}>
                <Typography
                  sx={{
                    color: "text.disabled",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  You've reached the end
                </Typography>
              </Box>
            )}

            {/* Sentinel element — triggers next page load via IntersectionObserver.
                Only rendered when more items are available and no error is pending. */}
            {hasMore && !paginationError && (
              <Box
                ref={sentinelRef}
                aria-hidden
                sx={{ height: 1, width: "100%" }}
              />
            )}
          </>
        )}
      </div>
      <FloatingActionButton />
    </>
  );
}
