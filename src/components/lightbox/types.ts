import type { Meme } from "../../types/meme";

export type { Meme };
/** @deprecated Use Meme instead */
export type GalleryItem = Meme;

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
  item: Meme | null;
  open: boolean;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
}
