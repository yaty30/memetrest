import { useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";
import UploadAssetCard from "../components/UploadAssetCard";
import "../components/UploadAssetCard.css";
import { submitAssetForReview } from "../services/uploadPipelineService";
import type { UploadAssetDoc } from "../types/upload";

interface MyUploadsViewProps {
  items: UploadAssetDoc[];
  loading: boolean;
  error: string | null;
}

export default function MyUploadsView({
  items,
  loading,
  error,
}: MyUploadsViewProps) {
  const [submittingById, setSubmittingById] = useState<Record<string, boolean>>(
    {},
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleSubmitForReview = async (assetId: string) => {
    setSubmittingById((prev) => ({ ...prev, [assetId]: true }));
    setActionError(null);
    setActionSuccess(null);

    try {
      const result = await submitAssetForReview({ assetId });
      setActionSuccess(
        result.submitted
          ? "Submitted for review. Upload remains private until separately published."
          : "This upload could not be submitted for review.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit for review.";
      setActionError(message);
    } finally {
      setSubmittingById((prev) => ({ ...prev, [assetId]: false }));
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: { xs: 8, sm: 10 },
        }}
      >
        <CircularProgress size={28} sx={{ color: "text.disabled" }} />
      </Box>
    );
  }

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}

      {items.length === 0 && (
        <Box
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: "12px",
            p: 3,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
            No uploads yet
          </Typography>
          <Typography sx={{ fontSize: "0.8125rem" }}>
            Use Upload from your account menu to create your first upload.
          </Typography>
        </Box>
      )}

      {items.length > 0 && (
        <div className="upload-grid">
          {items.map((item) => (
            <UploadAssetCard
              key={item.id}
              item={{
                id: item.id,
                title: item.title,
                status: item.status,
                visibility: item.visibility,
                createdAt: item.createdAt,
                mimeType: item.mimeType,
                dimensions: {
                  width: item.dimensions.width,
                  height: item.dimensions.height,
                },
                previewUrl: item.urls.previewUrl,
                thumbnailUrl: item.urls.thumbnailUrl,
                originalUrl: item.urls.originalUrl,
              }}
              submitting={Boolean(submittingById[item.id])}
              onSubmitForReview={handleSubmitForReview}
            />
          ))}
        </div>
      )}

      <Snackbar
        open={Boolean(actionSuccess)}
        autoHideDuration={4500}
        onClose={() => setActionSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={5000}
        onClose={() => setActionError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      </Snackbar>
    </>
  );
}
