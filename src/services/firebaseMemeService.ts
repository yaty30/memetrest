import type { MemeService } from "./memeService";
import type { GalleryItem } from "../data/galleryItems";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

function mapDoc(docSnap: {
  id: string;
  data: () => Record<string, unknown>;
}): GalleryItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = docSnap.data() as Record<string, any>;
  return {
    id: parseInt(docSnap.id) || 0,
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

export class FirebaseMemeService implements MemeService {
  async getGalleryItems(searchQuery = ""): Promise<GalleryItem[]> {
    const trimmed = searchQuery.trim().toLowerCase();
    const memesCol = collection(db, "memes");

    const q = trimmed
      ? query(
          memesCol,
          where("searchKeywords", "array-contains", trimmed),
          orderBy("uploadedAt", "desc"),
        )
      : query(memesCol, orderBy("uploadedAt", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDoc);
  }

  async getMemeById(id: string): Promise<GalleryItem | null> {
    const snap = await getDoc(doc(db, "memes", id));
    if (!snap.exists()) return null;
    return mapDoc(snap);
  }
}
