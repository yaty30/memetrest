import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { Navigate } from "react-router-dom";
import AppNavbar from "../components/navigation/AppNavbar";
import { useMyUploadAssets } from "../hooks/useMyUploadAssets";
import { useAuth } from "../providers/AuthProvider";
import { submitAssetForReview } from "../services/uploadPipelineService";
import {
  PAGE_CONTENT_PADDING_BOTTOM,
  PAGE_CONTENT_PADDING_TOP,
  PAGE_CONTENT_PADDING_X,
  PAGE_MAX_WIDTH,
  PAGE_NAV_PADDING_X,
} from "./pageLayout";

function formatCreatedAt(value: number): string {
  return new Date(value).toLocaleString();
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function workflowHint(status: string, visibility: string): string {
  if (status === "published" && visibility === "public") {
    return "Publicly visible in canonical published state.";
  }
  if (status === "pending_review") {
    return "Submitted for review. It is still private at this stage.";
  }
  if (status === "uploaded") {
    return "Uploaded successfully. It remains private until review and publish workflow completes.";
  }
  return "This upload is in a non-public workflow state.";
}

export default function MyUploadsPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const { items, loading, error } = useMyUploadAssets();
  const [submittingById, setSubmittingById] = useState<Record<string, boolean>>(
    {},
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isBusy = authLoading || loading;

  const canShowList = useMemo(
    () => !authLoading && !!firebaseUser,
    [authLoading, firebaseUser],
  );

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

  if (!authLoading && !firebaseUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: PAGE_NAV_PADDING_X,
          pt: { xs: 1.5, sm: 2 },
          pb: 0,
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <AppNavbar />
      </Box>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: PAGE_CONTENT_PADDING_X,
          pt: PAGE_CONTENT_PADDING_TOP,
          pb: PAGE_CONTENT_PADDING_BOTTOM,
          boxSizing: "border-box",
        }}
      >
        <Box
          component="main"
          sx={{
            bgcolor: "background.paper",
            borderRadius: { xs: 0, sm: "14px" },
            p: { xs: 2, sm: 3 },
            boxShadow: {
              xs: "none",
              sm: "0 0 0 1px rgba(255,255,255,0.04), 0 2px 12px rgba(0,0,0,0.25)",
            },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 700 }}>
              My Uploads
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
              Uploading is separate from publishing. Uploaded and pending review
              assets are not public content.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: "10px" }}>
            Public visibility is only for assets with status = published and
            visibility = public.
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          {isBusy && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {!isBusy && canShowList && items.length === 0 && (
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

          {!isBusy &&
            canShowList &&
            items.map((item) => {
              const preview =
                item.thumbnailUrl ?? item.previewUrl ?? item.originalUrl;
              const isReviewable = item.status === "uploaded";
              const submitting = Boolean(submittingById[item.id]);

              return (
                <Box
                  key={item.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "12px",
                    p: 2,
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Box
                      sx={{
                        width: { xs: "100%", sm: 120 },
                        height: { xs: 170, sm: 90 },
                        borderRadius: "10px",
                        backgroundColor: "surface.container",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.disabled",
                        flexShrink: 0,
                      }}
                    >
                      {preview ? (
                        <Box
                          component="img"
                          src={preview}
                          alt={item.title || "Uploaded asset preview"}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <UploadFileOutlinedIcon fontSize="large" />
                      )}
                    </Box>

                    <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {item.title ||
                          `Untitled upload (${item.id.slice(0, 8)})`}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          size="small"
                          label={`Status: ${toLabel(item.status)}`}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`Visibility: ${toLabel(item.visibility)}`}
                        />
                      </Stack>

                      <Typography
                        sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
                      >
                        Created: {formatCreatedAt(item.createdAt)}
                      </Typography>

                      <Typography
                        sx={{ fontSize: "0.8125rem", color: "text.secondary" }}
                      >
                        {item.mimeType}
                        {item.dimensions.width > 0 && item.dimensions.height > 0
                          ? ` • ${item.dimensions.width}x${item.dimensions.height}`
                          : ""}
                      </Typography>

                      <Alert
                        severity="warning"
                        sx={{ py: 0, borderRadius: "10px" }}
                      >
                        {workflowHint(item.status, item.visibility)}
                      </Alert>

                      {isReviewable && (
                        <Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSubmitForReview(item.id)}
                            disabled={submitting}
                          >
                            {submitting ? "Submitting..." : "Submit for review"}
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
        </Box>
      </Box>

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
    </Box>
  );
}
