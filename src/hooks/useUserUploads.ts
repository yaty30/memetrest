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
  const [uploads, setUploads] = useState<UploadAssetDoc[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUploads([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserUploads(
      userId,
      (nextUploads) => {
        setUploads(nextUploads);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load uploads.");
        setLoading(false);
      },
      {
        visibility: options.visibility,
      },
    );

    return () => {
      unsubscribe();
    };
  }, [options.visibility, userId]);

  const counts = useMemo(() => getUploadCounts(uploads), [uploads]);

  return {
    uploads,
    ...counts,
    loading,
    error,
  };
}
