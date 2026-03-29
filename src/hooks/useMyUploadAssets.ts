import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import {
  subscribeToUserUploadAssets,
  type UserUploadAssetListItem,
} from "../services/uploadPipelineService";

interface UseMyUploadAssetsResult {
  items: UserUploadAssetListItem[];
  loading: boolean;
  error: string | null;
}

export function useMyUploadAssets(): UseMyUploadAssetsResult {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [items, setItems] = useState<UserUploadAssetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!firebaseUser) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserUploadAssets(
      firebaseUser.uid,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load your uploads.");
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [authLoading, firebaseUser]);

  return { items, loading, error };
}
