import { useEffect, useState } from "react";
import { getUserProfile } from "../services/userService";
import { mapUploadAssetToCardModel } from "../services/uploadCardMapper";
import { subscribeToPendingReviewUploads } from "../services/uploadPipelineService";
import type { UploadAssetDoc } from "../types/upload";
import type { UserProfile } from "../types/user";

interface PendingApprovalUploader {
  uid: string;
  displayName: string;
  username: string | null;
}

export interface PendingApprovalItem {
  id: string;
  asset: UploadAssetDoc;
  previewUrl: string | null;
  uploader: PendingApprovalUploader;
}

interface UsePendingApprovalQueueResult {
  items: PendingApprovalItem[];
  loading: boolean;
  error: string | null;
}

const profileCache = new Map<string, Promise<UserProfile | null>>();

function getCachedProfile(uid: string): Promise<UserProfile | null> {
  const cached = profileCache.get(uid);
  if (cached) return cached;

  const next = getUserProfile(uid).catch(() => null);
  profileCache.set(uid, next);
  return next;
}

async function toPendingApprovalItem(
  asset: UploadAssetDoc,
): Promise<PendingApprovalItem> {
  const [cardModel, uploaderProfile] = await Promise.all([
    mapUploadAssetToCardModel(asset),
    getCachedProfile(asset.ownerId),
  ]);

  const displayName =
    uploaderProfile?.displayName?.trim() ||
    uploaderProfile?.authDisplayName?.trim() ||
    "Unknown uploader";
  const username = uploaderProfile?.username?.trim() || null;

  return {
    id: asset.id,
    asset,
    previewUrl: cardModel.previewUrl,
    uploader: {
      uid: asset.ownerId,
      displayName,
      username,
    },
  };
}

export function usePendingApprovalQueue(): UsePendingApprovalQueueResult {
  const [sourceAssets, setSourceAssets] = useState<UploadAssetDoc[]>([]);
  const [items, setItems] = useState<PendingApprovalItem[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubscriptionLoading(true);
    setError(null);

    const unsubscribe = subscribeToPendingReviewUploads(
      (nextAssets) => {
        setSourceAssets(nextAssets);
        setSubscriptionLoading(false);
      },
      (nextError) => {
        setError(nextError.message || "Failed to load pending approvals.");
        setSubscriptionLoading(false);
      },
      {
        pageSize: 250,
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setMappingLoading(true);

    void Promise.all(sourceAssets.map((asset) => toPendingApprovalItem(asset)))
      .then((mapped) => {
        if (!active) return;
        setItems(mapped);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
      })
      .finally(() => {
        if (!active) return;
        setMappingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sourceAssets]);

  return {
    items,
    loading: subscriptionLoading || mappingLoading,
    error,
  };
}
