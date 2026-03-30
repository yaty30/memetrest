import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import type { UploadCardModel } from "../services/uploadCardMapper";
import "./UploadAssetCard.css";

interface UploadAssetCardProps {
  item: UploadCardModel;
  submitting: boolean;
  onSubmitForReview: (assetId: string) => void;
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function workflowHint(status: string, visibility: string): string | null {
  if (status === "published" && visibility === "public") {
    return "Published publicly.";
  }
  if (status === "pending_review") {
    return "Submitted for review. Still private.";
  }
  if (status === "rejected") {
    return "Rejected. Not public.";
  }
  if (status === "uploaded" && visibility === "private") {
    return "Private upload.";
  }
  return null;
}

export default function UploadAssetCard({
  item,
  submitting,
  onSubmitForReview,
}: UploadAssetCardProps) {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);

  useEffect(() => {
    setPreviewLoaded(false);
    setPreviewLoadFailed(false);
  }, [item.id, item.previewUrl]);

  const preview = item.previewUrl;
  const showPreview = Boolean(preview) && previewLoaded && !previewLoadFailed;
  const isReviewable =
    item.reviewStatus === "uploaded" && item.visibility === "public";
  const hint = workflowHint(item.reviewStatus, item.visibility);
  const hasDimensions = item.width > 0 && item.height > 0;

  return (
    <article className="upload-card">
      <div className="upload-card__preview">
        {preview && (
          <img
            className="upload-card__preview-img"
            src={preview ?? undefined}
            style={{
              userSelect: "none",
              opacity: showPreview ? 1 : 0,
              transition: "opacity 180ms ease",
            }}
            draggable={false}
            alt={item.title || "Upload preview"}
            loading="lazy"
            onLoad={() => setPreviewLoaded(true)}
            onError={() => {
              setPreviewLoaded(false);
              setPreviewLoadFailed(true);
            }}
          />
        )}

        {!showPreview && (
          <div className="upload-card__preview-placeholder">
            <CircularProgress size={28} thickness={4.5} />
          </div>
        )}

        <div className="upload-card__badges">
          <span
            className={`upload-card__badge upload-card__badge--${item.reviewStatus}`}
          >
            {toLabel(item.reviewStatus)}
          </span>
          <span
            className={`upload-card__badge upload-card__badge--${item.visibility}`}
          >
            {toLabel(item.visibility)}
          </span>
        </div>
      </div>

      <div className="upload-card__body">
        <h3 className="upload-card__title">
          {item.title || `Untitled upload (${item.id.slice(0, 8)})`}
        </h3>

        <div className="upload-card__meta">
          <span>{item.mimeType}</span>
          {hasDimensions && (
            <>
              <span className="upload-card__meta-sep" />
              <span>
                {item.width}x{item.height}
              </span>
            </>
          )}
          <span className="upload-card__meta-sep" />
          <span>{formatDate(item.createdAt)}</span>
        </div>

        {hint && <p className="upload-card__hint">{hint}</p>}
      </div>

      {isReviewable && (
        <div className="upload-card__actions">
          <button
            className="upload-card__submit-btn"
            type="button"
            disabled={submitting}
            onClick={() => onSubmitForReview(item.id)}
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      )}
    </article>
  );
}
