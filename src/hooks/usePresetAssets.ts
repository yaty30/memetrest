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
  const [result, setResult] = useState<{
    kind: ProfileAssetKind | null;
    assets: ProfileAsset[];
    error: string | null;
  }>({
    kind: null,
    assets: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    getPresetAssets(kind)
      .then((result) => {
        if (!cancelled) {
          setResult({
            kind,
            assets: result,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            kind,
            assets: [],
            error: err instanceof Error ? err.message : "Failed to load assets",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  return {
    assets: result.kind === kind ? result.assets : [],
    loading: result.kind !== kind,
    error: result.kind === kind ? result.error : null,
  };
}
