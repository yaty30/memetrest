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

  const [items, setItems] = useState<UploadCardModel[]>([]);
  const [resolvingPreviews, setResolvingPreviews] = useState(false);

  useEffect(() => {
    let active = true;
    setResolvingPreviews(true);

    void Promise.all(uploads.map((upload) => mapUploadAssetToCardModel(upload)))
      .then((mapped) => {
        if (active) {
          setItems(mapped);
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
        }
      })
      .finally(() => {
        if (active) {
          setResolvingPreviews(false);
        }
      });

    return () => {
      active = false;
    };
  }, [uploads]);

  return {
    items,
    loading: authLoading || uploadsLoading || resolvingPreviews,
    error,
  };
}
