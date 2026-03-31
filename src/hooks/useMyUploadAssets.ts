import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import {
  mapUploadAssetToCardModel,
  type UploadCardModel,
} from "../services/uploadCardMapper";
import { useUserUploads } from "./useUserUploads";

interface UseMyUploadAssetsResult {
  items: UploadCardModel[];
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

  const uploadsKey = uploads
    .map((upload) => `${upload.id}:${upload.updatedAt ?? upload.createdAt}`)
    .join("|");
  const [mappingState, setMappingState] = useState<{
    key: string;
    items: UploadCardModel[];
  }>({
    key: "",
    items: [],
  });

  useEffect(() => {
    let active = true;

    void Promise.all(uploads.map((upload) => mapUploadAssetToCardModel(upload)))
      .then((mapped) => {
        if (active) {
          setMappingState({
            key: uploadsKey,
            items: mapped,
          });
        }
      })
      .catch(() => {
        if (active) {
          setMappingState({
            key: uploadsKey,
            items: [],
          });
        }
      });

    return () => {
      active = false;
    };
  }, [uploads, uploadsKey]);

  const resolvingPreviews = mappingState.key !== uploadsKey;
  const items = mappingState.key === uploadsKey ? mappingState.items : [];

  return {
    items,
    loading: authLoading || uploadsLoading || resolvingPreviews,
    error,
  };
}
