export interface GalleryItem {
  id: number;
  title: string;
  image: string;
  height: number;
  description?: string;
  tags?: string[];
  category?: string;
  width?: number;
  uploadedAt?: Date;
  storagePath?: string;
  overlay?: {
    avatar: string;
    name: string;
  };
}
