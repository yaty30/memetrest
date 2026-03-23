import type { MemeService } from "./memeService";
import type { GalleryItem } from "../data/galleryItems";
import { mockMemes } from "./mockData";

export class MockMemeService implements MemeService {
  async getGalleryItems(searchQuery = ""): Promise<GalleryItem[]> {
    const trimmed = searchQuery.trim().toLowerCase();

    // Simulate network latency for realistic loading states
    await new Promise((r) => setTimeout(r, 300));

    if (!trimmed) return [...mockMemes];

    return mockMemes.filter(
      (m) =>
        m.title.toLowerCase().includes(trimmed) ||
        m.tags?.some((t) => t.toLowerCase().includes(trimmed)) ||
        m.category?.toLowerCase().includes(trimmed),
    );
  }

  async getMemeById(id: string): Promise<GalleryItem | null> {
    await new Promise((r) => setTimeout(r, 150));
    return mockMemes.find((m) => m.id === parseInt(id)) ?? null;
  }
}
