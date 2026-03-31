import { useEffect, useMemo, useState } from "react";
import {
  subscribeToUserUploads,
  type UserUploadsVisibility,
} from "../services/uploadPipelineService";
import type { UploadAssetDoc } from "../types/upload";

export interface UserUploadsSummary {
  uploads: UploadAssetDoc[];
  totalCount: number;
  publishedCount: number;
  pendingCount: number;
  privateCount: number;
  loading: boolean;
  error: string | null;
}

interface UseUserUploadsOptions {
  visibility: UserUploadsVisibility;
}

const DEFAULT_OPTIONS: UseUserUploadsOptions = {
  visibility: "owner",
};

function getUploadCounts(uploads: UploadAssetDoc[]) {
  let publishedCount = 0;
  let pendingCount = 0;
  let privateCount = 0;

  for (const upload of uploads) {
    if (upload.status === "published" && upload.visibility === "public") {
      publishedCount += 1;
    }

    if (upload.status === "uploaded" || upload.status === "pending_review") {
      pendingCount += 1;
    }

    if (upload.visibility === "private") {
      privateCount += 1;
    }
  }

  return {
    totalCount: uploads.length,
    publishedCount,
    pendingCount,
    privateCount,
  };
}

export function useUserUploads(
  userId?: string | null,
  options: UseUserUploadsOptions = DEFAULT_OPTIONS,
): UserUploadsSummary {
  const queryKey = userId ? `${userId}:${options.visibility}` : null;
  const [snapshot, setSnapshot] = useState<{
    key: string | null;
    uploads: UploadAssetDoc[];
    error: string | null;
  }>({
    key: null,
    uploads: [],
    error: null,
  });

  useEffect(() => {
    if (!queryKey || !userId) return;

    const unsubscribe = subscribeToUserUploads(
      userId,
      (nextUploads) => {
        setSnapshot({
          key: queryKey,
          uploads: nextUploads,
          error: null,
        });
      },
      (err) => {
        setSnapshot({
          key: queryKey,
          uploads: [],
          error: err.message || "Failed to load uploads.",
        });
      },
      {
        visibility: options.visibility,
      },
    );

    return () => {
      unsubscribe();
    };
  }, [options.visibility, queryKey, userId]);

  const uploads = useMemo(
    () => (snapshot.key === queryKey ? snapshot.uploads : []),
    [queryKey, snapshot.key, snapshot.uploads],
  );
  const error = snapshot.key === queryKey ? snapshot.error : null;
  const loading = queryKey !== null && snapshot.key !== queryKey;

  const counts = useMemo(() => getUploadCounts(uploads), [uploads]);

  return {
    uploads,
    ...counts,
    loading,
    error,
  };
}
