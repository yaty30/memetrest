import { useAuth } from "../providers/AuthProvider";
import type { UserUploadAssetListItem } from "../services/uploadPipelineService";
import { useUserUploads } from "./useUserUploads";

interface UseMyUploadAssetsResult {
  items: UserUploadAssetListItem[];
  loading: boolean;
  error: string | null;
}

export function useMyUploadAssets(): UseMyUploadAssetsResult {
  const { firebaseUser, loading: authLoading } = useAuth();
  const {
    uploads,
    loading: uploadsLoading,
    error,
  } = useUserUploads(firebaseUser?.uid, {
    visibility: "owner",
  });

  const items: UserUploadAssetListItem[] = uploads.map((upload) => ({
    id: upload.id,
    title: upload.title,
    status: upload.status,
    visibility: upload.visibility,
    createdAt: upload.createdAt,
    mimeType: upload.mimeType,
    dimensions: {
      width: upload.dimensions.width,
      height: upload.dimensions.height,
    },
    previewUrl: upload.urls.previewUrl,
    thumbnailUrl: upload.urls.thumbnailUrl,
    originalUrl: upload.urls.originalUrl,
  }));

  return {
    items,
    loading: authLoading || uploadsLoading,
    error,
  };
}
