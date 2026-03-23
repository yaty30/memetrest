import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase";
import type { GalleryItem } from "../data/galleryItems";

function mapDoc(doc: {
  id: string;
  data: () => Record<string, unknown>;
}): GalleryItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = doc.data() as Record<string, any>;
  return {
    id: parseInt(doc.id) || 0,
    title: data.title ?? "Untitled",
    image: data.imageUrl ?? "",
    height: data.height ?? 300,
    description: data.description ?? "",
    tags: data.tags ?? [],
    category: data.category ?? "uncategorized",
    width: data.width ?? 0,
    uploadedAt: data.uploadedAt?.toDate() ?? new Date(),
    storagePath: data.storagePath ?? "",
    overlay: data.overlay ?? undefined,
  };
}

export function useGalleryImages(searchQuery = "") {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const trimmed = searchQuery.trim().toLowerCase();
    const memesCol = collection(db, "memes");

    const q = trimmed
      ? query(
          memesCol,
          where("searchKeywords", "array-contains", trimmed),
          orderBy("uploadedAt", "desc"),
        )
      : query(memesCol, orderBy("uploadedAt", "desc"));

    getDocs(q)
      .then((snapshot) => {
        if (!cancelled) setItems(snapshot.docs.map(mapDoc));
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
