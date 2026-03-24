import type { MemeCategory, SortOption } from "./meme";

/** State shape for the discovery filter panel. */
export interface DiscoveryFilters {
  activeTags: string[];
  activeCategory: MemeCategory | null;
  sortBy: SortOption;
  excludeNsfw: boolean;
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  activeTags: [],
  activeCategory: null,
  sortBy: "newest",
  excludeNsfw: true,
};
