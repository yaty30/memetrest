import { useState, useEffect } from "react";
import type { ProfileAsset, ProfileAssetKind } from "../types/user";
import { getPresetAssets } from "../services/profileService";

interface PresetAssetsState {
  assets: ProfileAsset[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches all approved preset assets for a given kind (avatar | banner).
 * Caches results for the lifetime of the component.
 */
export function usePresetAssets(kind: ProfileAssetKind): PresetAssetsState {
  const [assets, setAssets] = useState<ProfileAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPresetAssets(kind)
      .then((result) => {
        if (!cancelled) {
          setAssets(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load assets",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  return { assets, loading, error };
}
