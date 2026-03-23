import type { GalleryItem } from "../data/galleryItems";

/**
 * Abstract contract for meme data access.
 * Implementations: FirebaseMemeService (production), MockMemeService (development).
 */
export interface MemeService {
  getGalleryItems(searchQuery?: string): Promise<GalleryItem[]>;
  getMemeById(id: string): Promise<GalleryItem | null>;
}
