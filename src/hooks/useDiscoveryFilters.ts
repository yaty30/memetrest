import { useCallback, useMemo, useState } from "react";
import type { MemeCategory, SortOption } from "../types/meme";
import { DEFAULT_FILTERS, type DiscoveryFilters } from "../types/discovery";

export function useDiscoveryFilters() {
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);

  const setCategory = useCallback((cat: MemeCategory | null) => {
    setFilters((f) => ({ ...f, activeCategory: cat }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((f) => {
      const tags = f.activeTags.includes(tag)
        ? f.activeTags.filter((t) => t !== tag)
        : [...f.activeTags, tag];
      return { ...f, activeTags: tags };
    });
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setFilters((f) => ({ ...f, sortBy }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.activeTags.length > 0 ||
      filters.activeCategory !== null ||
      filters.sortBy !== "newest",
    [filters],
  );

  return {
    filters,
    setCategory,
    toggleTag,
    setSortBy,
    clearFilters,
    hasActiveFilters,
  };
}
