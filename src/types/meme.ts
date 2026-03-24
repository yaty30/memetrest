/** Categories available for meme filtering. */
export const MEME_CATEGORIES = [
  "reaction",
  "classic",
  "animals",
  "surreal",
  "opinion",
  "wholesome",
  "dark",
  "gaming",
  "anime",
  "tech",
  "uncategorized",
] as const;
export type MemeCategory = (typeof MEME_CATEGORIES)[number];

/** Sort options for the gallery. */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "mostLiked", label: "Most Liked" },
  { value: "trending", label: "Trending" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Core meme data model — maps 1:1 to a Firestore document. */
export interface Meme {
  id: string;
  title: string;
  description: string;
  image: string;
  storagePath: string;

  // Dimensions (for masonry layout)
  width: number;
  height: number;

  // Discovery metadata
  tags: string[];
  category: MemeCategory;
  templateName: string;
  language: string;
  nsfw: boolean;
  sensitive: boolean;

  // Timestamps
  createdAt: Date;

  // Engagement
  likeCount: number;
  shareCount: number;
  downloadCount: number;
  popularityScore: number;

  // Uploader
  overlay?: {
    avatar: string;
    name: string;
  };
}

/** Backward-compat alias during migration. */
export type GalleryItem = Meme;

/** Query parameters for fetching memes. */
export interface MemeQuery {
  searchText?: string;
  tags?: string[];
  category?: MemeCategory;
  sortBy?: SortOption;
  excludeNsfw?: boolean;
  limit?: number;
  cursor?: string;
}
