import { useMemo } from "react";
import { Box, Skeleton, useMediaQuery, useTheme } from "@mui/material";
import GalleryCard from "./GalleryCard";
import type { Meme } from "../types/meme";
import { normalizeMediaDimensions } from "../utils/mediaDimensions";

const DEFAULT_SKELETON_COUNT = 0;
const LOADING_MORE_COUNT = 8;

/** Fallback dimensions used by GalleryCard when metadata is missing — kept in sync. */
const skeletonMedia = normalizeMediaDimensions({
  fallbackWidth: 480,
  fallbackHeight: 320,
});

/* ── Types ── */

type RenderEntry =
  | { kind: "meme"; item: Meme }
  | { kind: "skeleton"; id: string };

/* ── Helpers ── */

function useColumnCount(): number {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  if (isMd) return 4;
  if (isSm) return 3;
  return 1;
}

/** Relative height (h/w) used to balance column heights. */
function entryRelativeHeight(entry: RenderEntry): number {
  if (entry.kind === "meme") {
    const w = entry.item.width > 0 ? entry.item.width : 480;
    const h = entry.item.height > 0 ? entry.item.height : 320;
    return h / w;
  }
  return skeletonMedia.height / skeletonMedia.width;
}

/**
 * Shortest-column-first distribution — gives the Pinterest / Giphy waterfall
 * where new items always land at the bottom of the shortest column.
 */
function distributeToColumns(
  entries: RenderEntry[],
  columnCount: number,
): RenderEntry[][] {
  const columns: RenderEntry[][] = Array.from(
    { length: columnCount },
    () => [],
  );
  const heights = new Float64Array(columnCount);

  for (const entry of entries) {
    let shortest = 0;
    for (let c = 1; c < columnCount; c++) {
      if (heights[c] < heights[shortest]) shortest = c;
    }
    columns[shortest].push(entry);
    heights[shortest] += entryRelativeHeight(entry);
  }

  return columns;
}

/* ── Component ── */

interface GalleryGridProps {
  items: Meme[];
  /** When true and items is empty, render skeleton placeholder cards. */
  loading?: boolean;
  /** When true, append skeleton placeholders after loaded items. */
  loadingMore?: boolean;
  skeletonCount?: number;
  onSelect?: (item: Meme) => void;
  onTagClick?: (tag: string) => void;
}

export default function GalleryGrid({
  items,
  loading,
  loadingMore,
  skeletonCount = DEFAULT_SKELETON_COUNT,
  onSelect,
  onTagClick,
}: GalleryGridProps) {
  const columnCount = useColumnCount();

  /* Build a single flat list: real items + optional skeleton placeholders */
  const entries = useMemo<RenderEntry[]>(() => {
    const list: RenderEntry[] = [];

    if (loading && items.length === 0) {
      for (let i = 0; i < skeletonCount; i++) {
        list.push({ kind: "skeleton", id: `init-skeleton-${i}` });
      }
      return list;
    }

    for (const item of items) {
      list.push({ kind: "meme", item });
    }

    if (loadingMore) {
      for (let i = 0; i < LOADING_MORE_COUNT; i++) {
        list.push({ kind: "skeleton", id: `more-skeleton-${i}` });
      }
    }

    return list;
  }, [items, loading, loadingMore, skeletonCount]);

  /* Distribute into columns using shortest-column-first */
  const columns = useMemo(
    () => distributeToColumns(entries, columnCount),
    [entries, columnCount],
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: "16px",
        px: { xs: 1.5, sm: 2.5 },
        pb: 5,
        pt: 1,
        alignItems: "flex-start",
      }}
    >
      {columns.map((col, colIdx) => (
        <Box
          key={colIdx}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {col.map((entry) =>
            entry.kind === "meme" ? (
              <GalleryCard
                key={entry.item.id}
                item={entry.item}
                onSelect={onSelect}
                onTagClick={onTagClick}
              />
            ) : (
              <Box
                key={entry.id}
                sx={{
                  borderRadius: "16px",
                  mb: "14px",
                  overflow: "hidden",
                  position: "relative",
                  aspectRatio: `${skeletonMedia.width} / ${skeletonMedia.height}`,
                  bgcolor: "rgba(255,255,255,0.04)",
                }}
              >
                <Skeleton
                  variant="rectangular"
                  animation="wave"
                  width="100%"
                  height="100%"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                  }}
                />
              </Box>
            ),
          )}
        </Box>
      ))}
    </Box>
  );
}
