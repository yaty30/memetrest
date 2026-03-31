import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GalleryGrid from "../GalleryGrid";
import ProfileEmptyState from "./ProfileEmptyState";
import { useProfileUploads } from "../../hooks/useProfileUploads";
import type { Meme } from "../../types/meme";

interface ProfileUploadsTabProps {
  ownerUid: string;
  isOwnProfile: boolean;
  scrollRootRef?: RefObject<Element | null>;
}

export default function ProfileUploadsTab({
  ownerUid,
  isOwnProfile,
  scrollRootRef,
}: ProfileUploadsTabProps) {
  const navigate = useNavigate();
  const { items, loading, loadingMore, hasMore, error, loadMore } =
    useProfileUploads(ownerUid, isOwnProfile);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (meme: Meme) => navigate(`/meme/${meme.id}`),
    [navigate],
  );

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: scrollRootRef?.current ?? null, rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, scrollRootRef]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: { xs: 8, sm: 10 },
        }}
      >
        <CircularProgress size={28} sx={{ color: "text.disabled" }} />
      </Box>
    );
  }

  if (error && items.length === 0) {
    return (
      <ProfileEmptyState
        icon={<ErrorOutlineIcon sx={{ fontSize: 44 }} />}
        title="Failed to load uploads"
        subtitle={error}
      />
    );
  }

  if (items.length === 0) {
    return (
      <ProfileEmptyState
        icon={<CloudUploadOutlinedIcon sx={{ fontSize: 44 }} />}
        title="No uploads yet"
        subtitle={
          isOwnProfile
            ? "Your uploaded memes will appear here"
            : "This user hasn't uploaded any memes yet"
        }
      />
    );
  }

  return (
    <Box sx={{ minHeight: 600, mx: { xs: -2, sm: -3, md: -5, pt: 3 } }}>
      <GalleryGrid
        items={items}
        loadingMore={loadingMore}
        onSelect={handleSelect}
      />

      {/* Pagination error banner */}
      {error && items.length > 0 && (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography sx={{ fontSize: "0.8rem", color: "error.main", mb: 1 }}>
            {error}
          </Typography>
          <Button size="small" onClick={loadMore}>
            Retry
          </Button>
        </Box>
      )}

      {/* Infinite-scroll sentinel */}
      {hasMore && <Box ref={sentinelRef} sx={{ height: 1 }} />}
    </Box>
  );
}
