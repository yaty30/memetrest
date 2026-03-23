import { useState, useEffect } from "react";
import type { GalleryItem } from "../data/galleryItems";
import { memeService } from "../services";

export function useGalleryImages(searchQuery = "") {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    memeService
      .getGalleryItems(searchQuery)
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load images",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  return { items, loading, error };
}
