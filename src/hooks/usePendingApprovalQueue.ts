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
  const [sourceAssets, setSourceAssets] = useState<UploadAssetDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sourceKey =
    sourceAssets?.map((asset) => `${asset.id}:${asset.updatedAt}`).join("|") ?? "";
  const [mappingState, setMappingState] = useState<{
    key: string;
    items: PendingApprovalItem[];
  }>({
    key: "",
    items: [],
  });

  useEffect(() => {
    const unsubscribe = subscribeToPendingReviewUploads(
      (nextAssets) => {
        setSourceAssets(nextAssets);
        setError(null);
      },
      (nextError) => {
        setError(nextError.message || "Failed to load pending approvals.");
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
    if (!sourceAssets) return;

    let active = true;

    void Promise.all(sourceAssets.map((asset) => toPendingApprovalItem(asset)))
      .then((mapped) => {
        if (!active) return;
        setMappingState({
          key: sourceKey,
          items: mapped,
        });
      })
      .catch(() => {
        if (!active) return;
        setMappingState({
          key: sourceKey,
          items: [],
        });
      });

    return () => {
      active = false;
    };
  }, [sourceAssets, sourceKey]);

  const subscriptionLoading = sourceAssets === null;
  const mappingLoading =
    sourceAssets !== null && mappingState.key !== sourceKey;
  const items = mappingState.key === sourceKey ? mappingState.items : [];

  return {
    items,
    loading: subscriptionLoading || mappingLoading,
    error,
  };
}
