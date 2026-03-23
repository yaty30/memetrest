import type { GalleryItem } from "../../data/galleryItems";

export type { GalleryItem };

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  text: string;
  createdAt: Date;
}

export interface LightboxProps {
  item: GalleryItem | null;
  open: boolean;
  onClose: () => void;
}
